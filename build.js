#!/usr/bin/env node

/**
 * Build script for Giulia Bertoluzzi portfolio.
 * Generates trilingual HTML files from templates + i18n.json.
 * Zero external dependencies.
 *
 * Usage: node build.js
 */

var fs = require('fs');
var path = require('path');

var LANGS = ['it', 'en', 'fr'];
var ROOT = __dirname;

// Load i18n translations
var i18n = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'i18n.json'), 'utf8'));

// Load templates
var pageTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'page.html'), 'utf8');
var landingTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'landing.html'), 'utf8');

/**
 * Resolve a dotted key path (e.g. "consulting.card1.title") from the i18n object
 * for a given language.
 */
function resolveKey(keyPath, lang) {
    var parts = keyPath.split('.');
    var obj = i18n;
    for (var i = 0; i < parts.length; i++) {
        obj = obj[parts[i]];
        if (obj === undefined) return undefined;
    }
    // obj should now be { it: "...", en: "...", fr: "..." }
    if (typeof obj === 'object' && obj[lang] !== undefined) {
        return obj[lang];
    }
    return undefined;
}

/**
 * Build a single language page from the page template.
 */
function buildPage(lang) {
    var html = pageTemplate;

    // Replace {{lang}}
    html = html.replace(/\{\{lang\}\}/g, lang);

    // Replace {{locale}}
    var locale = i18n.locale[lang];
    html = html.replace(/\{\{locale\}\}/g, locale);

    // Replace {{og_locale_alternates}}
    var alternates = i18n.locale_alternates[lang];
    var altTags = alternates.map(function(loc) {
        return '    <meta property="og:locale:alternate" content="' + loc + '">';
    }).join('\n');
    html = html.replace(/\{\{og_locale_alternates\}\}/g, altTags);

    // Replace {{lang_active_XX}}
    LANGS.forEach(function(l) {
        var placeholder = '{{lang_active_' + l + '}}';
        html = html.split(placeholder).join(lang === l ? 'active' : '');
    });

    // Replace all {{key.path}} i18n placeholders
    html = html.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, function(match, keyPath) {
        var value = resolveKey(keyPath, lang);
        if (value !== undefined) return value;
        // If not resolved, leave it (will be caught by validation)
        return match;
    });

    return html;
}

// --- Generate files ---

var generated = [];

// Generate language pages
LANGS.forEach(function(lang) {
    var html = buildPage(lang);
    var outDir = path.join(ROOT, lang);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    var outFile = path.join(outDir, 'index.html');
    fs.writeFileSync(outFile, html, 'utf8');
    generated.push(lang + '/index.html');
});

// Generate landing page (static, no templating needed)
var landingOut = path.join(ROOT, 'index.html');
fs.writeFileSync(landingOut, landingTemplate, 'utf8');
generated.push('index.html');

// --- Validation ---

var errors = [];
generated.forEach(function(relPath) {
    var fullPath = path.join(ROOT, relPath);
    var content = fs.readFileSync(fullPath, 'utf8');
    var remaining = content.match(/\{\{[a-zA-Z0-9_.]+\}\}/g);
    if (remaining) {
        errors.push(relPath + ': unresolved placeholders: ' + remaining.join(', '));
    }
});

if (errors.length > 0) {
    console.error('\n[ERROR] Unresolved placeholders found:');
    errors.forEach(function(e) { console.error('  ' + e); });
    process.exit(1);
}

console.log('[build] Generated ' + generated.length + ' files:');
generated.forEach(function(f) { console.log('  ' + f); });
console.log('[build] All placeholders resolved. Done.');
