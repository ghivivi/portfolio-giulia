#!/usr/bin/env node

/**
 * CSV-to-JSON sync script for Portfolio Giulia Bertoluzzi.
 *
 * Reads config/projects.csv (semicolon-delimited, RFC 4180 quoting)
 * and updates the "projects" array inside config/projects.json,
 * preserving the top-level "categories" and "categoryOrder" keys.
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
            // Skip leading whitespace only if not quoted
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
        categories: row.categories ? row.categories.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : []
    };

    // mainpage: only include if true (matches existing JSON convention)
    if (row.mainpage === 'true') {
        project.mainpage = true;
    }

    // video: build object only if type is provided
    if (row.video_type && row.video_type.trim()) {
        var video = { type: row.video_type.trim() };
        if (row.video_id && row.video_id.trim()) video.id = row.video_id.trim();
        if (row.video_src && row.video_src.trim()) video.src = row.video_src.trim();
        project.video = video;
    }

    // allegati: comma-separated URLs
    project.allegati = row.allegati ? row.allegati.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];

    // testo: multilingual text content
    project.testo = {
        it: row.testo_it || '',
        en: row.testo_en || '',
        fr: row.testo_fr || ''
    };

    return project;
}

// ---- Main ----

function main() {
    // Read CSV
    var csvText = fs.readFileSync(CSV_PATH, 'utf8');
    var csvRows = csvToObjects(csvText);

    // Read existing JSON to preserve categories and categoryOrder
    var existingData = {};
    try {
        existingData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    } catch (e) {
        console.error('Warning: could not read existing JSON, starting fresh.');
    }

    // Convert CSV rows to project objects
    var projects = csvRows.map(csvRowToProject);

    // Build output preserving top-level keys
    var output = {
        categories: existingData.categories || {},
        categoryOrder: existingData.categoryOrder || [],
        projects: projects
    };

    // Write JSON
    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

    console.log('Updated ' + JSON_PATH + ' with ' + projects.length + ' projects from CSV.');
}

main();
