/// <reference path="~/Scripts/cmaps.mapviewer.js" />

if (config == null)
    var config = {};

// Colours available to the text drawing tools
config.drawingcolours = [
    { "value": "#000000", "selected":"selected", "style":"color: #000000;", "label":"Black" },
    { "value": "#0000FF", "style":"color: #0000FF;", "label":"Blue" },
    { "value": "#008000", "style":"color: #008000;", "label":"Green" },
    { "value": "#00C5CD", "style":"color: #00C5CD;", "label":"Turquoise" },
    { "value": "#1E90FF", "style":"color: #1E90FF;", "label":"Light Blue" },
    { "value": "#820BBB", "style":"color: #820BBB;", "label":"Violet" },
    { "value": "#A3A3A3", "style":"color: #A3A3A3;", "label":"Grey" },
    { "value": "#FF0000", "style":"color: #FF0000;", "label":"Red" },
    { "value": "#FFAA00", "style":"color: #FFAA00;", "label":"Gold" },
    { "value": "#FFFF00", "style":"color: #FFFF00;", "label":"Yellow" }
];

// Fonts values
config.labelfonts = [
    { "value": "Arial", "style": "font-family: Arial;", "label": "Arial" },
    { "value": "Serif", "selected": "selected", "style": "font-family: Serif;", "label": "Serif" },
    { "value": "Times New Roman", "style": "font-family: Times New Roman;", "label": "Times New Roman" }
];

// Font sizes
config.fontSizes = [
    { "value": "8", "style": "font-size: 8pt;", "label": "8" },
    { "value": "10", "style": "font-size: 10pt;", "label": "10" },
    { "value": "12", "selected": "selected", "style": "font-size: 12pt;", "label": "12" },
    { "value": "14", "style": "font-size: 14pt;", "label": "14" },
    { "value": "16", "style": "font-size: 16pt;", "label": "16" },
    { "value": "18", "style": "font-size: 18pt;", "label": "18" },
    { "value": "20", "style": "font-size: 20pt;", "label": "20" },
    { "value": "22", "style": "font-size: 22pt;", "label": "22" },
    { "value": "24", "style": "font-size: 24pt;", "label": "24" },
    { "value": "26", "style": "font-size: 26pt;", "label": "26" },
    { "value": "28", "style": "font-size: 28pt;", "label": "28" },
    { "value": "30", "style": "font-size: 30pt;", "label": "30" }
];

// Font Styles
config.fontStyles = [
    { "value": "Regular", "selected": "selected", "style": "font-weight: normal; font-style: normal;", "label": "Regular" },
    { "value": "Bold", "style": "font-weight: bold; font-style: normal;", "label": "Bold" },
    { "value": "Italic", "style": "font-weight: normal; font-style: italic;", "label": "Italic" },
    { "value": "BoldItalic", "style": "font-weight: bold; font-style: italic;", "label": "Bold &amp; Italic" }
];

// Label rotation options
config.labelRotation = [
    { "value": "-90", "label": "-90" },
    { "value": "-60", "label": "-60" },
    { "value": "-45", "label": "-45" },
    { "value": "-30", "label": "-30" },
    { "value": "0", "selected": "selected", "label": "0" },
    { "value": "30", "label": "30" },
    { "value": "45", "label": "45" },
    { "value": "60", "label": "60" },
    { "value": "90", "label": "90" }
];