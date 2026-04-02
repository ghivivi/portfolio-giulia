#!/usr/bin/env node

/**
 * CSV-to-JSON sync script for Portfolio Giulia Bertoluzzi.
 *
 * Reads config/projects.csv (semicolon-delimited, RFC 4180 quoting)
 * and MERGES into the "projects" array inside config/projects.json:
 *   - rows whose id matches an existing project → fields are updated
 *   - rows whose id is not found → appended as new projects
 *
 * Preserves the top-level "sections" key unchanged.
 * If the CSV has only a header row and no data rows, exits without touching the JSON.
 *
 * allegati column format: "url1|label1,url2|label2"
 *
 * Usage:  node scripts/csv-to-json.js
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var CSV_PATH = path.join(ROOT, 'config', 'projects.csv');
var JSON_PATH = path.join(ROOT, 'config', 'projects.json');

// ---- RFC 4180 CSV parser (semicolon delimiter) ----

function parseCSV(text, delimiter) {
    delimiter = delimiter || ';';
    var rows = [];
    var i = 0;
    var len = text.length;

    while (i < len) {
        var row = [];
        while (true) {
            var field = '';
            if (i < len && text[i] === '"') {
                // Quoted field
                i++; // skip opening quote
                while (i < len) {
                    if (text[i] === '"') {
                        if (i + 1 < len && text[i + 1] === '"') {
                            // Escaped double quote
                            field += '"';
                            i += 2;
                        } else {
                            // End of quoted field
                            i++; // skip closing quote
                            break;
                        }
                    } else {
                        field += text[i];
                        i++;
                    }
                }
                // Skip until delimiter or newline
                while (i < len && text[i] !== delimiter && text[i] !== '\n' && text[i] !== '\r') {
                    i++;
                }
            } else {
                // Unquoted field
                while (i < len && text[i] !== delimiter && text[i] !== '\n' && text[i] !== '\r') {
                    field += text[i];
                    i++;
                }
            }

            row.push(field);

            if (i >= len) break;
            if (text[i] === delimiter) {
                i++; // skip delimiter
                continue;
            }
            // Newline — end of row
            if (text[i] === '\r') i++;
            if (i < len && text[i] === '\n') i++;
            break;
        }
        // Skip empty trailing rows
        if (row.length === 1 && row[0] === '' && i >= len) break;
        rows.push(row);
    }

    return rows;
}

function csvToObjects(text) {
    var rows = parseCSV(text, ';');
    if (rows.length < 2) return [];

    var headers = rows[0];
    var objects = [];

    for (var r = 1; r < rows.length; r++) {
        var row = rows[r];
        // Skip rows that are completely empty
        if (row.length === 1 && row[0] === '') continue;

        var obj = {};
        for (var c = 0; c < headers.length; c++) {
            obj[headers[c]] = (c < row.length) ? row[c] : '';
        }
        objects.push(obj);
    }

    return objects;
}

// ---- Mapping logic ----

/**
 * Parse the allegati column.
 * Format: "url1|label1,url2|label2"
 * Returns: [{ url: "url1", label: "label1" }, ...]
 * If a segment has no pipe, uses the whole segment as url with empty label.
 */
function parseAllegati(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.split(',').map(function(segment) {
        segment = segment.trim();
        if (!segment) return null;
        var pipeIdx = segment.indexOf('|');
        if (pipeIdx === -1) {
            return { url: segment, label: '' };
        }
        return {
            url: segment.slice(0, pipeIdx).trim(),
            label: segment.slice(pipeIdx + 1).trim()
        };
    }).filter(Boolean);
}

function csvRowToProject(row) {
    var project = {
        id: row.id || '',
        visible: row.visible === 'true',
        order: parseInt(row.order, 10) || 999,
        date: row.date || '',
        video: null,
        thumbnail: {
            url: row.thumbnail_url || '',
            fallbackGradient: row.thumbnail_fallbackGradient || 'linear-gradient(135deg, #E5DDD4 0%, #FAF8F5 100%)'
        },
        title: {
            it: row.title_it || '',
            en: row.title_en || '',
            fr: row.title_fr || ''
        },
        articleUrl: row.articleUrl || '',
        categories: row.categories
            ? row.categories.split(',').map(function(s) { return s.trim(); }).filter(Boolean)
            : [],
        allegati: parseAllegati(row.allegati),
        testo: {
            it: row.testo_it || '',
            en: row.testo_en || '',
            fr: row.testo_fr || ''
        },
        mainpage: row.mainpage === 'true'
    };

    // video: build object only if type is provided
    if (row.video_type && row.video_type.trim()) {
        var video = { type: row.video_type.trim() };
        if (row.video_id && row.video_id.trim()) video.id = row.video_id.trim();
        if (row.video_src && row.video_src.trim()) video.src = row.video_src.trim();
        project.video = video;
    }

    // subcategory: optional, only include if non-empty
    if (row.subcategory && row.subcategory.trim()) {
        project.subcategory = row.subcategory.trim();
    }

    // description: optional multilingual block, only include if at least one language is non-empty
    var desc_it = row.description_it || '';
    var desc_en = row.description_en || '';
    var desc_fr = row.description_fr || '';
    if (desc_it || desc_en || desc_fr) {
        project.description = { it: desc_it, en: desc_en, fr: desc_fr };
    }

    // tags: optional, only include if at least one tag field is non-empty
    var tags_format   = row.tags_format   ? row.tags_format.trim()   : '';
    var tags_role     = row.tags_role     ? row.tags_role.trim()     : '';
    var tags_location = row.tags_location ? row.tags_location.trim() : '';
    if (tags_format || tags_role || tags_location) {
        var tags = {};
        if (tags_format)   tags.format   = tags_format;
        if (tags_role)     tags.role     = tags_role;
        if (tags_location) tags.location = tags_location;
        project.tags = tags;
    }

    return project;
}

// ---- Section auto-registration ----

/**
 * For each CSV row that has a `section` value, check whether the categories
 * and subcategory listed in that row are already registered in sections[section].
 * If not, append them automatically.
 *
 * @param {Array}  csvRows       - parsed CSV row objects
 * @param {Object} sections      - the existing sections object (mutated in place)
 * @returns {number}             - number of new categories/subcategories added
 */
function autoRegisterSections(csvRows, sections) {
    var added = 0;

    for (var r = 0; r < csvRows.length; r++) {
        var row = csvRows[r];
        var sectionId = row.section ? row.section.trim() : '';
        if (!sectionId) continue;

        // Ensure the section exists
        if (!sections[sectionId]) {
            sections[sectionId] = { order: [] };
            console.log('  New section created: "' + sectionId + '"');
            added++;
        }
        var sec = sections[sectionId];
        if (!sec.order) sec.order = [];

        // Register each category from this row
        var cats = row.categories
            ? row.categories.split(',').map(function(s) { return s.trim(); }).filter(Boolean)
            : [];

        for (var c = 0; c < cats.length; c++) {
            var catId = cats[c];
            if (sec.order.indexOf(catId) === -1) {
                sec.order.push(catId);
                console.log('  New category added to "' + sectionId + '": "' + catId + '"');
                added++;
            }

            // Register subcategory if present
            var subId = row.subcategory ? row.subcategory.trim() : '';
            if (subId) {
                if (!sec.subcategories) sec.subcategories = {};
                if (!sec.subcategories[catId]) sec.subcategories[catId] = [];
                if (sec.subcategories[catId].indexOf(subId) === -1) {
                    sec.subcategories[catId].push(subId);
                    console.log('  New subcategory added to "' + catId + '": "' + subId + '"');
                    added++;
                }
            }
        }
    }

    return added;
}

// ---- Main ----

function main() {
    // Read CSV
    var csvText = fs.readFileSync(CSV_PATH, 'utf8');
    var csvRows = csvToObjects(csvText);

    if (csvRows.length === 0) {
        console.log('No data rows in CSV. Nothing to do.');
        return;
    }

    // Read existing JSON
    var existingData = { sections: {}, projects: [] };
    try {
        existingData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    } catch (e) {
        console.error('Warning: could not read existing JSON, starting fresh.');
    }

    var sections = existingData.sections || {};
    var existingProjects = existingData.projects || [];

    // Auto-register new categories/subcategories from CSV rows that have a `section` value
    var sectionsAdded = autoRegisterSections(csvRows, sections);

    // Build an index of existing projects by id for O(1) lookup
    var projectIndex = {};
    for (var i = 0; i < existingProjects.length; i++) {
        if (existingProjects[i].id) {
            projectIndex[existingProjects[i].id] = i;
        }
    }

    var updated = 0;
    var appended = 0;

    for (var r = 0; r < csvRows.length; r++) {
        var csvRow = csvRows[r];
        if (!csvRow.id || !csvRow.id.trim()) {
            console.warn('Warning: skipping row ' + (r + 1) + ' with missing id.');
            continue;
        }

        var newProject = csvRowToProject(csvRow);

        if (projectIndex.hasOwnProperty(csvRow.id)) {
            // Merge: replace existing project at that index position
            existingProjects[projectIndex[csvRow.id]] = newProject;
            updated++;
        } else {
            // Append new project and update index
            existingProjects.push(newProject);
            projectIndex[csvRow.id] = existingProjects.length - 1;
            appended++;
        }
    }

    // Build output
    var output = {
        sections: sections,
        projects: existingProjects
    };

    // Write JSON
    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

    console.log(
        'Done. Updated: ' + updated + ' project(s), appended: ' + appended +
        ' new project(s), sections entries added: ' + sectionsAdded +
        '. Total: ' + existingProjects.length + ' projects in ' + JSON_PATH
    );
}

main();
