#!/usr/bin/env node

/**
 * Build script for Giulia Bertoluzzi portfolio.
 * Generates trilingual HTML files from templates + i18n.
 * Zero external dependencies.
 *
 * Placeholder types:
 *   {{key.path}}           — resolves from config/i18n.json (meta, locale, etc.)
 *   {{rt.key.path}}        — resolves from config/i18n/{lang}.json (runtime translations)
 *   {{lang}}               — language code (it, en, fr)
 *   {{locale}}             — OG locale (it_IT, en_GB, fr_FR)
 *   {{og_locale_alternates}} — alternate locale meta tags
 *   {{lang_active_XX}}     — "active" class for language switcher
 *   {{year}}               — current year
 *
 * Usage: node build.js
 */

var fs = require('fs');
var path = require('path');

var LANGS = ['it', 'en', 'fr'];
var ROOT = __dirname;
var CURRENT_YEAR = new Date().getFullYear().toString();

// Load i18n master config (meta, locale, consulting cards, etc.)
var i18n = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'i18n.json'), 'utf8'));

// Load per-language runtime translations
var runtimeI18n = {};
LANGS.forEach(function(lang) {
    runtimeI18n[lang] = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'config', 'i18n', lang + '.json'), 'utf8')
    );
});

// Load templates
var pageTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'page.html'), 'utf8');
var landingTemplate = fs.readFileSync(path.join(ROOT, 'templates', 'landing.html'), 'utf8');

/**
 * Resolve a dotted key path from the i18n master config for a given language.
 * e.g. "meta.title" → i18n.meta.title[lang]
 */
function resolveKey(keyPath, lang) {
    var parts = keyPath.split('.');
    var obj = i18n;
    for (var i = 0; i < parts.length; i++) {
        obj = obj[parts[i]];
        if (obj === undefined) return undefined;
    }
    if (typeof obj === 'object' && obj !== null && obj[lang] !== undefined) {
        return obj[lang];
    }
    return undefined;
}

/**
 * Resolve a dotted key path from the runtime i18n file for a given language.
 * e.g. "hero.subtitle" → runtimeI18n[lang].hero.subtitle
 */
function resolveRuntimeKey(keyPath, lang) {
    var parts = keyPath.split('.');
    var obj = runtimeI18n[lang];
    for (var i = 0; i < parts.length; i++) {
        if (obj === undefined || obj === null) return undefined;
        obj = obj[parts[i]];
    }
    if (typeof obj === 'string') return obj;
    return undefined;
}

/**
 * Build a single language page from the page template.
 */
function buildPage(lang) {
    var html = pageTemplate;

    // Replace {{lang}}
    html = html.replace(/\{\{lang\}\}/g, lang);

    // Replace {{year}}
    html = html.replace(/\{\{year\}\}/g, CURRENT_YEAR);

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

    // Replace {{rt.key.path}} — runtime i18n placeholders
    html = html.replace(/\{\{rt\.([a-zA-Z0-9_.]+)\}\}/g, function(match, keyPath) {
        var value = resolveRuntimeKey(keyPath, lang);
        if (value !== undefined) return value;
        return match;
    });

    // Replace {{key.path}} — master i18n placeholders
    html = html.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, function(match, keyPath) {
        var value = resolveKey(keyPath, lang);
        if (value !== undefined) return value;
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
