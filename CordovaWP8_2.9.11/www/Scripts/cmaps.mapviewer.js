/*
Copyright License  - Canterbury Regional Council and Partners
Attribution-NonCommercial-ShareAlike 3.0 New Zealand (CC BY-NC-SA 3.0 NZ)
http://creativecommons.org/licenses/by-nc-sa/3.0/nz/
*/


/* DOJO INCLUDES
-----------------------------------------------------------------------------------------------*/

dojo.require('dijit.layout.BorderContainer');
dojo.require('dijit.layout.ContentPane');
dojo.require('dijit.TitlePane');
dojo.require('dijit.form.Button');
dojo.require('esri.arcgis.utils');
dojo.require('esri.map');
dojo.require('dijit.dijit'); // optimize: load dijit layer
dojo.require('esri.dijit.Scalebar');
dojo.require('esri.dijit.Measurement');
dojo.require('esri.toolbars.navigation');
dojo.require('esri.dijit.editing.TemplatePicker-all');
dojo.require('esri.dijit.BasemapGallery');
dojo.require('esri.tasks.PrintTask');
dojo.require('dijit.Menu');
dojo.require('esri.dijit.Print');
if (isMobile.any() === null) dojo.require('esri.dijit.Popup');
if (isMobile.any() !== null) dojo.require("esri.dijit.PopupMobile");


/* CONFIGURATION
-----------------------------------------------------------------------------------------------*/
if (config == null)
    var config = {};

var currentLocation, grid, store, resizeTimer;

//set for debug mode
var debugMode = true;

//set site url
ecan.mapviewer.SiteURL = "http://canterburymaps.govt.nz/viewer/";

// Map component
ecan.mapviewer.map = null;
ecan.mapviewer.loadresponse = null;
ecan.mapviewer.itemrenderers = null;
ecan.mapviewer.esrilogoShow = false;

//Popups
ecan.mapviewer.popups;

// Basemap
ecan.mapviewer.basemap = null;
ecan.mapviewer.basemapurl = null;
ecan.mapviewer.basemaptitle = null;

// Mouse Position
ecan.mapviewer.mapsheet = null;

// Graphics layers for drawing and results
ecan.mapviewer.graphicsLayer = null;
ecan.mapviewer.resultsLayer = null;

// Toolbars
ecan.mapviewer.navToolbar = null;
ecan.mapviewer.drawToolbar = null;
ecan.mapviewer.editToolbar = null;
ecan.mapviewer.navMode = null;
ecan.mapviewer.drawMode = null;
ecan.mapviewer.currentDrawTool = null;
ecan.mapviewer.specialDrawTool = null;

// Map layers container
ecan.mapviewer.mapLayers = {};
ecan.mapviewer.activeLayer = null;

// Context menus
ecan.mapviewer.ctxMenuForMap = null;
ecan.mapviewer.ctxMenuForGraphics = null;

// Drawing symbols and templates
ecan.mapviewer.symbols = [];
ecan.mapviewer.templatePicker = null;
ecan.mapviewer.lastDrawSymbolType = null;

// Style symbols and templates
ecan.mapviewer.lastStyleType = null;
ecan.mapviewer.styles = [];
ecan.mapviewer.stylePicker = null;
ecan.mapviewer.textStyle = null;

// Search results
ecan.mapviewer.selectedSymbol = null;
ecan.mapviewer.selectedGraphic = null;
ecan.mapviewer.resultsEmptyHtml = null;

// Tolerance for point features when searching
ecan.mapviewer.pointTolerance = 3;

// Quick Search
ecan.mapviewer.quickSearchSelected = null;
ecan.mapviewer.quickSearch = {
    "CON": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/Resource_Consents/MapServer/0", fields: "*", expression: "ConsentNo = '[value]'", title: "Resource Consents" },
    "WEL": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/Groundwater/MapServer/1", fields: "*", expression: "WELL_NO = '[value]'", title: "Wells" },
    "VAL": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/Region_Base/MapServer/6", fields: "*", expression: "VALUATION_NO = '[value]'", title: "Property Info" },
    "PAR": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/Region_Base/MapServer/6", fields: "*", expression: "PAR_ID = '[value]'", title: "Property Info" },
    "RDI": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/Region_Base/MapServer/5", fields: "*", expression: "OBJECTID = [value]", title: "Road Details" },
    "GWQ": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/WaterQualityAndMonitoring/MapServer/1", fields: "*", expression: "SITE_NO = '[value]'", title: "Groundwater Quality Sites" },
    "SWQ": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/WaterQualityAndMonitoring/MapServer/0", fields: "*", expression: "SITE_ID = '[value]'", title: "Surface Water Quality Sites" },
    "PRP": { url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Public/TAPropertyData/MapServer/0", fields: "*", expression: "TA_PROPERTY_REFERENCE = '[value]'", title: "Property Info" }
};
ecan.mapviewer.quickSearchFilter = 'CON,WEL,VAL,PAR,RDI,RDC,GWQ,SWQ,NAM,LEG';
ecan.mapviewer.quickSearchURL = ecan.mapviewer.SiteURL + 'Search.ashx';

// Printing tools
ecan.mapviewer.printer = null;
ecan.mapviewer.printServiceURL = "http://gis.ecan.govt.nz/arcgis/rest/services/Printing/Printing/GPServer/Export%20Web%20Map";
ecan.mapviewer.showprinting = true; // Flag for wther the printing functionality is activated. 

// Measurement Tools
ecan.mapviewer.measurement = null;
ecan.mapviewer.locationToolbar = null;

// Create control pressed event
ecan.mapviewer.ctrlPressed = false;

// Set the geometry service and url
ecan.mapviewer.geometryURL = "http://gis.ecan.govt.nz/arcgis/rest/services/Utilities/Geometry/GeometryServer";
ecan.mapviewer.geometryService = null;
ecan.mapviewer.currentBuffer = null;
ecan.mapviewer.bufferdistance = null;

// Help location
ecan.mapviewer.helplocation = "http://canterburymaps.govt.nz/Portal/Home/Help";
ecan.mapviewer.helptopics = [
    { "topicname": "Introduction", "viewermode": "all", "filename": "Help.htm" },
    //{ "topicname": "Searching", "viewermode": "all", "filename": "HelpSearching.htm" },
    { "topicname": "Map Gallery", "viewermode": "all", "filename": "HelpMapGallery.htm" },
    //{ "topicname": "Changing Layer Visibility", "viewermode": "all", "filename": "HelpLayers.htm" },
    //{ "topicname": "Changing Basemaps", "viewermode": "all", "filename": "HelpBasemaps.htm" },
    { "topicname": "Using GPS", "viewermode": "phone", "filename": "HelpGPS.htm" },
    //{ "topicname": "Using Touch Devices", "viewermode": "phone|tablet", "filename": "HelpUsingTouch.htm" },
    //{ "topicname": "Using the Mouse", "viewermode": "desktop", "filename": "HelpUsingTheMouse.htm" },
    //{ "topicname": "Using the Keyboard", "viewermode": "desktop", "filename": "HelpUsingTheKeyboard.htm" },
    { "topicname": "Measuring", "viewermode": "desktop|tablet", "filename": "HelpMeasurement.htm" },
    { "topicname": "Location Tools", "viewermode": "desktop|tablet", "filename": "HelpLocateTools.htm" },
    { "topicname": "Drawing", "viewermode": "desktop|tablet", "filename": "HelpDrawing.htm" },
    { "topicname": "Identification Tools", "viewermode": "desktop|tablet", "filename": "HelpIdentification.htm" },
    { "topicname": "Advanced Search", "viewermode": "desktop|tablet", "filename": "HelpAdvancedSearch.htm" },
    { "topicname": "Printing", "viewermode": "desktop", "filename": "HelpPrinting.htm" }
];


// Terms and conditions location
if (ecan.mapviewer.isNative) {
    ecan.mapviewer.termslocation = "CMTermsAndConditions_mobile.htm";
} else {
    ecan.mapviewer.termslocation = "CMTermsAndConditions.htm";
}
ecan.mapviewer.termsdateflag = '20121025_01';
ecan.mapviewer.termsredirect = 'http://canterburymaps.govt.nz';
ecan.mapviewer.termsdialogWidth = 650;
ecan.mapviewer.termsdialogHeight = 500;

if (isMobile.any() != null && (isMobile.Tablet() == null || isMobile.Tablet() == false)) {
    ecan.mapviewer.termsdialogWidth = 312;
    ecan.mapviewer.termsdialogHeight = 480;
    $(document).ready(function () {
        ecan.mapviewer.termsdialogWidth = $(window).width() - 10;
        ecan.mapviewer.termsdialogHeight = $(window).height();
    });
}

//gps graphics layer
ecan.mapviewer.gpsLayer = null;


/* DEFAULT ARCGIS ONLINE MAP SETTINGS
-----------------------------------------------------------------------------------------------*/
// Default WebMap ID. This WebMap loads when no webmap query string parameter is specified on map.html
config.defaultWebmap = "8b1c927324744c4890da8fe66db5c4b3";

ecan.mapviewer.currentWebmap = null;

//Save Map json objects using esri.arcgis.utils.getItem() - gets json for item & itemData
ecan.mapviewer.deferred = null;


/* INITIALISE MAP
-----------------------------------------------------------------------------------------------*/

function init(mapid) {

    ///Set url for portal
    esri.arcgis.utils.arcgisUrl = "http://arcgis.com/sharing/content/items";

    //absolute needs to be set for ... native client
    esri.config.defaults.io.proxyUrl = ecan.mapviewer.SiteURL + "proxy.ashx";

    esri.config.defaults.geometryService = new esri.tasks.GeometryService(ecan.mapviewer.geometryURL);

    if (mapid != null) {
        ecan.mapviewer.currentWebmap = mapid;
    }
    if (ecan.mapviewer.currentWebmap == null) {
        ecan.mapviewer.currentWebmap = config.defaultWebmap;
    }

    //Prepare mobile popups if present
    if (isMobile.any() != null) {
        //create a mobile popup
        ecan.mapviewer.popups = new esri.dijit.PopupMobile(null, dojo.create("div"));

        // Load the map from arcgis.com WITH MOBILE POPUPS
        ecan.mapviewer.deferred = esri.arcgis.utils.createMap(ecan.mapviewer.currentWebmap, 'map',
                    {
                        mapOptions: { slider: true, logo: ecan.mapviewer.esrilogoShow, infoWindow: ecan.mapviewer.popups },
                        bingMapsKey: null,
                        ignorePopups: false,
                        geometryServiceURL: ecan.mapviewer.geometryURL
                    }
                );
    } else {
        // Load the map from arcgis.com WITHOUT MOBILE POPUP
        ecan.mapviewer.deferred = esri.arcgis.utils.createMap(ecan.mapviewer.currentWebmap, 'map',
                    {
                        mapOptions: { slider: true, logo: ecan.mapviewer.esrilogoShow },
                        bingMapsKey: null,
                        ignorePopups: false,
                        geometryServiceURL: ecan.mapviewer.geometryURL
                    }
                );
    }

    //deferred function to load map.
    ecan.mapviewer.deferred.then(function (response) {
        // Set the map
        ecan.mapviewer.map = response.map;

        // Set the basemap
        ecan.mapviewer.basemaptitle = response.itemInfo.itemData.baseMap.title;
        ecan.mapviewer.basemapurl = response.itemInfo.itemData.baseMap.baseMapLayers[0].url;
        ecan.mapviewer.basemap = response.itemInfo.itemData.baseMap.baseMapLayers[0].id;

        // Add the drawing graphics layer
        ecan.mapviewer.graphicsLayer = new esri.layers.GraphicsLayer();
        ecan.mapviewer.graphicsLayer.id = "Drawing Graphics";
        ecan.mapviewer.graphicsLayer.visible = true;
        ecan.mapviewer.map.addLayer(ecan.mapviewer.graphicsLayer, 0);

        // Add the search results graphics layer
        ecan.mapviewer.resultsLayer = new esri.layers.GraphicsLayer({ opacity: 0.70 });
        ecan.mapviewer.resultsLayer.id = "Search Results";
        ecan.mapviewer.resultsLayer.visible = true;
        ecan.mapviewer.map.addLayer(ecan.mapviewer.resultsLayer, 0);

        // Add the gps display graphics layer
        ecan.mapviewer.gpsLayer = new esri.layers.GraphicsLayer();
        ecan.mapviewer.gpsLayer.id = "GPS Graphics";
        ecan.mapviewer.gpsLayer.visible = true;
        ecan.mapviewer.map.addLayer(ecan.mapviewer.gpsLayer, 0);

        // Hook up the legend component
        dojo.connect(ecan.mapviewer.map, 'onLayersAddResult', function (results) {
            ecan.mapviewer.refreshLegend();
        });
        // Initialise the legend
        ecan.mapviewer.refreshLegend();

        // Setup the basemap gallery
        ecan.mapviewer.createBasemapGallery();

        // Add navbar listeners
        ecan.mapviewer.navToolbar = new esri.toolbars.Navigation(ecan.mapviewer.map);
        dojo.connect(ecan.mapviewer.navToolbar, "onExtentHistoryChange", ecan.mapviewer.extentHistoryChangeHandler);

        // if mobile hide scalebar 
        if (isMobile.any() == null) {
            // Add the scalebar
            ecan.mapviewer.scalebar = new esri.dijit.Scalebar({
                map: ecan.mapviewer.map,
                scalebarUnit: 'metric',
                attachTo: 'bottom-left'
            });
        }

        // Get the current map scale
        ecan.mapviewer.updateScaleSettings();

        // After map loads, connect to listen to mouse move & drag events
        dojo.connect(ecan.mapviewer.map, 'onMouseMove', ecan.mapviewer.showCoordinates);
        dojo.connect(ecan.mapviewer.map, 'onMouseDrag', ecan.mapviewer.showCoordinates);
        dojo.connect(ecan.mapviewer.map, 'onMouseOut', ecan.mapviewer.clearCoordinates);
        dojo.connect(ecan.mapviewer.map, 'onExtentChange', ecan.mapviewer.updateScaleSettings);
        dojo.connect(ecan.mapviewer.map, 'onLoad', ecan.mapviewer.showintialExtent());

        // Confirm the graphics layers are clear
        ecan.mapviewer.graphicsLayer.clear();
        ecan.mapviewer.resultsLayer.clear();
        ecan.mapviewer.map.graphics.clear();


        // if iOS hide zoom buttons
        if (isMobile.iOS() != null) {
            ecan.mapviewer.map.hideZoomSlider();
        }


        //assume loading is complete or on its way ... so
        //hide the loading gif
        $('#mapContainer').removeClass('loading');

        //check browser Support
        ecan.mapviewer.notSupported();

    });

    dojo.connect(dijit.byId('map'), 'resize', function () {
        //resize the map if the div is resized    
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            ecan.mapviewer.map.resize();
            ecan.mapviewer.map.reposition();
        }, 500);
    });

    // Add listener for a keypress
    $(document).keyup(function (e) {
        if (e.keyCode == 27) { ecan.mapviewer.toolclick('pan'); }   // esc
    });

    // Prepare the print widget - Get print templates from the export web map task
    if (ecan.mapviewer.showprinting == true) {
        ecan.mapviewer.preparePrintDialog();
    }
    else {
        $('#printButton').remove();
    }

    // Prepare share tools
    ecan.mapviewer.prepareShareTools();

    // Prepare the buffer dialog
    ecan.mapviewer.prepareBufferDialog();

    // Prepare the style dialog
    ecan.mapviewer.prepareStyleDialog();

    $(document).ready(function () {
        /*
    Tool tips (run if not mobile)
    -*/
        if (isMobile.any() == null) {
            $('.toolbutton, .idtool, .drawtool, #measurementTool').tooltip({
                position: {
                    my: "center bottom-20",
                    at: "center top",
                    using: function (position, feedback) {
                        $(this).css(position);
                        $("<div>")
                          .addClass("arrow")
                          .addClass(feedback.vertical)
                          .addClass(feedback.horizontal)
                          .appendTo(this);
                    }
                }
            });
        };

        //SETUP SIDE MENU TOOL TIP
        //Show tool tip afterwards only if not mobile 
        ecan.mapviewer.DelayedToolTips($("#sidebarmenuButton", false));

        //SETUP RESULTS MENU TOOL TIP IF Visible (i.e. not in mobile)
        //DELAY THE SETTING OF THE TOOL TIP for the layout to be ready
        if ($('#bottombarButton').is(':visible')) {
            ecan.mapviewer.DelayedToolTips($("#bottombarButton", false));
        }


        //Load GPS script if device has GPS
        if (isMobile.any() != null && (navigator.geolocation)) {
            $.getScript("Scripts/geolocation.js")
            ecan.mapviewer.DelayedToolTips($("#gpsButton"), false);
        } else {
            $("#gpsButton").hide();
        }

    });

} // Finished Init Map

ecan.mapviewer.showintialExtent = function () {
    if (debugMode) console.log("showinitialExtent");
    //if extent exists zoom to ...
    var extent = "";
    extent = ecan.tools.urlParam('extent');
    if (debugMode) console.log(extent);
    if (extent != "") {
        extent = extent.split(",");
        if (debugMode) console.log(extent);
        var mapExtent = new esri.geometry.Extent({
            "xmin": parseFloat(extent[0]), "ymin": parseFloat(extent[1]), "xmax": parseFloat(extent[2]), "ymax": parseFloat(extent[3]),
            "spatialReference": { "wkid": ecan.mapviewer.map.spatialReference.wkid }
        });
        if (debugMode) console.log(mapExtent);
        ecan.mapviewer.map.setExtent(mapExtent, true);
    };
};

/* SPLASH SCREEN FUNCTIONALITY
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.prepareSplashDialog = function () {
    // Load the disclaimer content
    $.get(ecan.mapviewer.termslocation, function (data) {
        $('#disclaimerContent').html(data);
    });

    // Setup the dialog
    $('#disclaimerDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        closeOnEscape: false,
        title: "Terms and Conditions",
        height: ecan.mapviewer.termsdialogHeight,
        width: ecan.mapviewer.termsdialogWidth,
        buttons: {
            "Proceed": function () {
                // Close the dialog to enable the map to be used
                $(this).dialog("close");

                // set the cookie
                ecan.mapviewer.setCookie('mapviewertermsandconditions', ecan.mapviewer.termsdateflag, 60);

                //start quick map dialog;
                ecan.mapviewer.prepareQuickMapsDialog();
            },
            "Cancel": function () {
                // Redirect to the main entrance site
                if (isMobile.any() == null) window.location = ecan.mapviewer.termsredirect;
            }
        }
    }).removeClass('hidden');

    // Fix the padding
    $('.ui-dialog-content').css('padding', '2px');

    // Disable the proceed button
    $(":button:contains('Proceed')").attr("disabled", true).addClass('ui-state-disabled');

    //diable the close btn top right
    $(".ui-dialog-titlebar-close").hide();

    // Open the dialog
    $('#disclaimerDialog').dialog('open');
};

ecan.mapviewer.disclaimerChecked = function () {
    if ($('#disclaimerCheck').is(':checked')) {
        // Enable the proceed button
        $(":button:contains('Proceed')").attr("disabled", false).removeClass('ui-state-disabled');
    }
    else {
        // Disable the proceed button
        $(":button:contains('Proceed')").attr("disabled", true).addClass('ui-state-disabled');
    }
};

/* QUICK MAP DIALOG */
ecan.mapviewer.prepareQuickMapsDialog = function () {

    // Setup the dialog
    $('#quickmapsDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        closeOnEscape: false,
        title: "Quick Maps: Choose a map",
        height: ecan.mapviewer.termsdialogHeight,
        width: ecan.mapviewer.termsdialogWidth
    }).removeClass('hidden');

    //make sure the new dialog starts at the beginning
    $('#quickmapsDialog').dialog({
        close: function (event, ui) { ecan.mapviewer.Gallery.goback(); }
    });

    // Fix the padding
    $('.ui-dialog-content').css('padding', '2px');

    //disable the close btn top right
    $(".ui-dialog-titlebar-close").hide();

    // Initialise the Quick Map selection if no webmapid present
    if (ecan.mapviewer.currentWebmap == '') {

        $('#quickmapsDialog').dialog('open');

        // Open the dialog
        if (debugMode) console.log('open quickmaps dialog');
        dojo.ready(ecan.mapviewer.Gallery.QuickMapsinit);
    } else {
        init();
    }
}


/* TOOL CLICKS
-----------------------------------------------------------------------------------------------*/

// Called when the toolbutton is clicked
ecan.mapviewer.toolclick = function (tool) {
    // Clear the active tool
    ecan.mapviewer.clearActiveTool();

    // Set the action of the new
    switch (tool) {
        case "zoomin":
            ecan.mapviewer.navMode = tool;
            $('#zoominButton').addClass('active');
            ecan.mapviewer.setToolLabel("Zoom In Tool");
            ecan.mapviewer.navToolbar.activate(esri.toolbars.Navigation.ZOOM_IN);
            break;

        case "zoomout":
            ecan.mapviewer.navMode = tool;
            $('#zoomoutButton').addClass('active');
            ecan.mapviewer.setToolLabel("Zoom Out Tool");
            ecan.mapviewer.navToolbar.activate(esri.toolbars.Navigation.ZOOM_OUT);
            break;

        case "pan":
            ecan.mapviewer.navMode = tool;
            $('#panButton').addClass('active');
            ecan.mapviewer.setToolLabel("Pan Tool");
            ecan.mapviewer.navToolbar.activate(esri.toolbars.Navigation.PAN);

            // Test enable rubber band zoom
            ecan.mapviewer.map.enableRubberBandZoom();
            break;
    }
};

ecan.mapviewer.buttonclick = function (button) {
    // Deactivate the active tools
    ecan.mapviewer.clearActiveTool();

    // Set the action of the new
    switch (button) {
        case "zoomprevious":
            // Get the button state
            if (ecan.mapviewer.getIsEnabled('zoompreviousButton')) {
                ecan.mapviewer.navToolbar.zoomToPrevExtent();
            }
            break;

        case "zoomnext":
            // Get the button state
            if (ecan.mapviewer.getIsEnabled('zoomnextButton')) {
                ecan.mapviewer.navToolbar.zoomToNextExtent();
            }
            break;

        case "zoomfull":
            // Get the button state
            if (ecan.mapviewer.getIsEnabled('zoomfullButton')) {
                ecan.mapviewer.navToolbar.zoomToFullExtent();
            }
            break;

        case "locate":
            // Hide the other tools
            $('.toolbox').hide();

            if ($.trim($('#locateTool').html()) == '') {
                // Prepare the Locate UI 
                ecan.coordinates.prepareLocateUI('locateTool');

                if (isMobile.any() == null) {
                    $('#locateTool .toolbutton, #locateTool .cinput').tooltip({
                        position: {
                            my: "center bottom-20",
                            at: "center top",
                            using: function (position, feedback) {
                                $(this).css(position);
                                $("<div>")
                                  .addClass("arrow")
                                  .addClass(feedback.vertical)
                                  .addClass(feedback.horizontal)
                                  .appendTo(this);
                            }
                        }
                    });
                }
            }

            // Show the locate tools
            $('#locateContainer').show();

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar();

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "measure":
            // Hide the other tools
            $('.toolbox').hide();

            if ($.trim($('#measurementTool').html()) == '') {
                // Call create measure tool
                ecan.mapviewer.createMeasureTool();
            }
            else {
                // Show the measuremnt tools
                $('#measurementContainer').show();
            }

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar();

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "draw":
            // Hide the other tools
            $('.toolbox').hide();

            // Set drawmode
            ecan.mapviewer.drawMode = "drawing";

            if (ecan.mapviewer.templatePicker == null) {
                // Call create drawing tool
                ecan.mapviewer.createDrawingTools();

                // Create the label text dialog
                ecan.mapviewer.prepareLabelDialog();
            }
            else {
                // Show the drawing tools
                $('#drawingContainer').show();
            }

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar()

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "identify":
            // Hide the other tools
            $('.toolbox').hide();

            // Set drawmode
            ecan.mapviewer.drawMode = "identify";

            // Prepare the drawing toolbar
            if (ecan.mapviewer.drawToolbar == null) {
                ecan.mapviewer.drawToolbar = new esri.toolbars.Draw(ecan.mapviewer.map);
                dojo.connect(ecan.mapviewer.drawToolbar, "onDrawEnd", ecan.mapviewer.drawToolEnd);
            }

            // Show the drawing tools
            $('#idContainer').show();

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar()

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "query":
            // Hide the other tools
            $('.toolbox').hide();

            // Show the drawing tools
            $('#queryContainer').show();

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar()

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "share":
            // Hide the other tools
            $('.toolbox').hide();

            // Show the drawing tools
            $('#shareContainer').show();

            // is the side bar open/closed?
            if (!$('#mainContainer').hasClass('MapisOffseted'))
                ecan.mapviewer.toggleSideBar()

            // Open the tool tab
            ecan.mapviewer.showTitleTab(2);
            break;

        case "print":
            // Show the print dialog
            $('#printDialog').dialog("open");
            break;

        case "results":
            ecan.mapviewer.toggleResults('toggle');
            break;

        case "clearSelection":
            ecan.mapviewer.clearSelection();
            break;

        case "help":
            window.open(ecan.mapviewer.helplocation);
            break;

        case "gps":
            //geoLocate();
            ToggleGeolocate();
            break;

        case "quickmaps":
            ecan.mapviewer.Gallery.QuickMapsinit();

            //enable the close btn top right
            $(".ui-dialog-titlebar-close").show();

            $('#quickmapsDialog').dialog('open');

            break;
    }
};

//try out new slide option ...
ecan.mapviewer.toggleSideBar = function () {

    //get width of side bar and animate to that size
    var width = $('#sidebar').css('width');

    if (!$('#mainContainer').hasClass('MapisOffseted')) {
        // show nav no since its hidden behind map.
        $('#sidebar').show();

        // do an offset of the map container
        $('#mainContainer').animate({
            left: width
        }, "fast", function () {
            // Animation complete.
            $('#mainContainer').addClass('MapisOffseted');
            ecan.mapviewer.map.reposition();
        });
    } else {
        // remove the offset and animate back
        $('#mainContainer').animate({
            left: '0'
        }, "fast", function () {
            // Animation complete.
            $('#mainContainer').removeClass('MapisOffseted');
            ecan.mapviewer.map.reposition();
            // show nav no since its hidden behind map.
            $('#sidebar').hide();

        });
    };

    //make sure the side bar is filled correctly
    // refresh tabs for height
    $("#sidebarTabs").tabs({ heightStyle: "fill" });
};


ecan.mapviewer.toggleResults = function (action) {
    switch (action) {
        case "open":
            $('#searchResultsGrid').removeClass('hidden')
            $('#searchResultsGrid').show();
            $(".resultToolsBtns").show();
            $('#footDet').addClass('footDet_Open');
            break;
        case "close":
            $('#searchResultsGrid').hide();
            $(".resultToolsBtns").hide();
            $('#searchResultsGrid').addClass('hidden');
            $('#footDet').removeClass('footDet_Open');
            break;
        case "toggle":
            // Show or hide the results datagrid
            if ($('#searchResultsGrid').hasClass('hidden')) {
                $('#searchResultsGrid').removeClass('hidden')
                $('#searchResultsGrid').show();
                $(".resultToolsBtns").show();
                $('#footDet').addClass('footDet_Open');
            } else {
                $('#searchResultsGrid').hide();
                $(".resultToolsBtns").hide();
                $('#searchResultsGrid').addClass('hidden');
                $('#footDet').removeClass('footDet_Open');
            }
            break;
    }
    // Call for the dojo components to be resized
    var mc = dijit.byId('mainContainer');
    mc.resize();

    // Reset the map size
    ecan.mapviewer.map.resize();
    ecan.mapviewer.map.reposition();
};

ecan.mapviewer.clearActiveTool = function () {
    $('.toolbutton.active').removeClass('active');
    $('.drawtool.active').removeClass('active');
    $('.idtool.active').removeClass('active');

    // Clear the navMode
    ecan.mapviewer.navMode = null;

    // Deactivate the navigation tools 
    ecan.mapviewer.deactivateNavigationTool();

    // Deactivate the measure tool
    ecan.mapviewer.deactivateMeasureTool();

    // Deactivate the drawing tool
    ecan.mapviewer.deactivateDrawTool();
    ecan.mapviewer.specialDrawTool = null;

    // Deactivate the edit tool
    ecan.mapviewer.deactivateEditTool();

    // Enable the popups
    ecan.mapviewer.enablePopups();
};

ecan.mapviewer.deactivateNavigationTool = function () {
    if (ecan.mapviewer.navToolbar != null) {
        ecan.mapviewer.navToolbar.deactivate();
    }
};

ecan.mapviewer.deactivateEditTool = function () {
    if (ecan.mapviewer.editToolbar != null) {
        ecan.mapviewer.editToolbar.deactivate();
    }
};

ecan.mapviewer.getIsEnabled = function (button) {
    var isDisabled = $("#" + button).hasClass('.disabled');
    return !isDisabled;
};


/* MAP EVENTS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.extentHistoryChangeHandler = function () {
    // Update the extent history
    if (ecan.mapviewer.navToolbar.isFirstExtent()) {
        $('#zoompreviousButton').addClass('disabled');
    } else {
        $('#zoompreviousButton').removeClass('disabled');
    }

    if (ecan.mapviewer.navToolbar.isLastExtent()) {
        $('#zoomnextButton').addClass('disabled');
    } else {
        $('#zoomnextButton').removeClass('disabled');
    }
}

ecan.mapviewer.showCoordinates = function (evt) {
    // Get mapPoint from event
    var mp = evt.mapPoint;

    // Calculate the grid reference
    if (mapsheets != undefined) {
        // Find the sheet based on the current
        if (ecan.mapviewer.mapsheet != null) {
            // Check if the current points is still within the extent
            if (ecan.mapviewer.mapsheet.xmin <= mp.x && ecan.mapviewer.mapsheet.xmax >= mp.x &&
                ecan.mapviewer.mapsheet.ymin <= mp.y && ecan.mapviewer.mapsheet.ymax >= mp.y) {
                // do nothing - the sheet is current
            }
            else {
                ecan.mapviewer.updateMapSheet(mp);
            }
        }
        else {
            ecan.mapviewer.updateMapSheet(mp);
        }
        $('#mouseGridRef').html('NZTopo50: ' + ecan.mapviewer.prepareGridRef(mp));
    }
    else {
        // Clear the grid reference
        $('#mouseGridRef').html('');
    }

    // Display mouse coordinates
    $('#mouseLocationX').html("NZTM X: " + ecan.tools.addCommas(mp.x.toFixed(0).toString()) + " mE");
    $('#mouseLocationY').html("NZTM Y: " + ecan.tools.addCommas(mp.y.toFixed(0).toString()) + " mN");
};

ecan.mapviewer.prepareGridRef = function (mp) {
    if (ecan.mapviewer.mapsheet == null) {
        return 'Offshore';
    }
    else {
        return ecan.mapviewer.mapsheet.sheet + ":" + mp.x.toString().substring(2, 6) + "-" + mp.y.toString().substring(2, 6);
    }
};

ecan.mapviewer.updateMapSheet = function (mp) {
    ecan.mapviewer.mapsheet = null;
    $.each(mapsheets, function () {
        if (this.xmin <= mp.x && this.xmax >= mp.x && this.ymin <= mp.y && this.ymax >= mp.y) {
            ecan.mapviewer.mapsheet = this;
            return false;
        }
    });
};

ecan.mapviewer.clearCoordinates = function () {
    // Clear coordinates
    $('#mouseLocationX').html("NZTM X:");
    $('#mouseLocationY').html("NZTM Y:");
    $('#mouseGridRef').html('');
};

ecan.mapviewer.updateScaleSettings = function () {
    if (ecan.mapviewer.map != null) {
        // Update the scale text
        var scale = esri.geometry.getScale(ecan.mapviewer.map);
        $('#mapScale').html("Map Scale: 1:" + ecan.tools.addCommas(scale.toFixed(0).toString()));
    }
};

ecan.mapviewer.setToolLabel = function (toolname) {
    $('#activeToolLabel').html(toolname);
};

ecan.mapviewer.updateLegendState = function () {
    $.each(ecan.mapviewer.map.layers, function () {
        var vis = this.visibleAtMapScale();

        if (!vis) {
            // Disable the checkbox for this layer in the legend 
            $('.visibleCheck[layerId="' + this.Id + '"]').attr('disabled', true);
        }
        else {
            // Enable the checkbox for this layer in the legend
            $('.visibleCheck[layerId="' + this.Id + '"]').attr('disabled', false);
        }
    });
};

/* UI FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.createBasemapGallery = function () {
    // Manually create basemaps to add to basemap gallery 
    var basemaps = [];

    var nztopo50 = new esri.dijit.Basemap({
        layers: [new esri.dijit.BasemapLayer({
            url: "http://gis.ecan.govt.nz/arcgis/rest/services/Topoimagery/MapServer"
        })],
        id: "nztopo50",
        title: "Topographic Basemap",
        thumbnailUrl: "Content/images/basemap_topographic.jpg"
    });
    basemaps.push(nztopo50);

    var imagery = new esri.dijit.Basemap({
        layers: [new esri.dijit.BasemapLayer({
            url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/Imagery/MapServer"
        })],
        id: "imagery",
        title: "Imagery Basemap",
        thumbnailUrl: "Content/images/basemap_imagery.jpg"
    });
    basemaps.push(imagery);

    var streets = new esri.dijit.Basemap({
        layers: [new esri.dijit.BasemapLayer({
            url: "http://gis.ecan.govt.nz/ArcGIS/rest/services/SimpleBasemap/MapServer"
        })],
        id: "streets",
        title: "Basic Street Basemap",
        thumbnailUrl: "Content/images/basemap_streets.jpg"
    });
    basemaps.push(streets);

    ecan.mapviewer.basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: false,
        basemaps: basemaps,
        map: ecan.mapviewer.map
    }, "basemapGallery");

    ecan.mapviewer.basemapGallery.startup();

    dojo.connect(ecan.mapviewer.basemapGallery, "onError", function (error) {
        console.log(error)
    });

    // Add listenr to change the basemap legend
    dojo.connect(ecan.mapviewer.basemapGallery, "onSelectionChange", function () {
        var base = ecan.mapviewer.basemapGallery.getSelected();
        //basemapid = base.layers[0].id;
        basemapid = base.id;
        ecan.mapviewer.basemapurl = base.layers[0].url;
        ecan.mapviewer.toggleSideBar();
    });
};

ecan.mapviewer.createMeasureTool = function () {
    ecan.mapviewer.measurement = new esri.dijit.Measurement({
        map: ecan.mapviewer.map,
        defaultAreaUnit: esri.Units.SQUARE_METERS,
        defaultLengthUnit: esri.Units.METERS
    }, dojo.byId('measurementTool'));

    ecan.mapviewer.measurement.startup();

    // Hijack the measure tool action and replace with own code 
    dijit.byId("dijit_form_ToggleButton_2").attr('onClick', ecan.mapviewer.toggleLocationTool);

    // Add click events to the area and length button to change the active tool
    $('#measurementTool [id="dijit_form_ToggleButton_0"]')
        .unbind('click.measure')
        .bind('click.measure', function () {
            var i = this;
            if (this.parentElement.parentElement.className.toString().indexOf("esriButtonCheckedFocused") > -1) {
                ecan.mapviewer.setToolLabel("Pan Tool");

                // Enable the map popups again
                ecan.mapviewer.enablePopups();
            }
            else {
                ecan.mapviewer.setToolLabel("Measure Area Tool");

                // Disable the map popups
                ecan.mapviewer.disablePopups();
            }

            ecan.mapviewer.deactivateLocationDrawTool();
        });

    $('#measurementTool [id="dijit_form_ToggleButton_1"]')
        .unbind('click.measure')
        .bind('click.measure', function () {
            var i = this;
            if (this.parentElement.parentElement.className.toString().indexOf("esriButtonCheckedFocused") > -1) {
                ecan.mapviewer.setToolLabel("Pan Tool");

                // Enable the map popups again
                ecan.mapviewer.enablePopups();
            }
            else {
                ecan.mapviewer.setToolLabel("Measure Line Tool");

                // Disable the map popups
                ecan.mapviewer.disablePopups();
            }

            ecan.mapviewer.deactivateLocationDrawTool();
        });

    // Prepare the measure location draw toolbar
    ecan.mapviewer.locationToolbar = new esri.toolbars.Draw(ecan.mapviewer.map);
    dojo.connect(ecan.mapviewer.locationToolbar, "onDrawEnd", function (geometry) {
        if (geometry.type == esri.toolbars.Draw.POINT) {
            // Update Locaion details
            var coord = '<strong>X: </strong>' + ecan.mapviewer.formatCoord(geometry.x) + ' <strong>Y: </strong>' + ecan.mapviewer.formatCoord(geometry.y);
            $('#measurementTool > div.result').html(coord);

            // Clear existing graphics
            ecan.mapviewer.map.graphics.clear();

            // Add the graphic to the map
            var gra = new esri.Graphic(geometry, ecan.mapviewer.measurement._pointSymbol, { X: ecan.mapviewer.formatCoord(geometry.x), Y: ecan.mapviewer.formatCoord(geometry.y) }, null);
            ecan.mapviewer.map.graphics.add(gra);
        }
    });

    // Show the tool div
    $('#measurementContainer').show();
};

ecan.mapviewer.deactivateMeasureTool = function () {
    if (ecan.mapviewer.measurement != undefined) {
        ecan.mapviewer.measurement.setTool('area', false);
    }
};

ecan.mapviewer.deactivateLocationDrawTool = function () {
    ecan.mapviewer.locationToolbar.deactivate();

    // Clear any point graphics
    var graphs = [];
    $.each(ecan.mapviewer.map.graphics.graphics, function () {
        if (this.geometry.type == esri.toolbars.Draw.POINT) {
            graphs.push(this);
        }
    });
    $.each(graphs, function () {
        ecan.mapviewer.map.graphics.remove(this);
    });
};

ecan.mapviewer.showLoading = function () {
    esri.show(loading);
    ecan.mapviewer.map.disableMapNavigation();
    ecan.mapviewer.map.hideZoomSlider();
}

ecan.mapviewer.hideLoading = function (error) {
    esri.hide(loading);
    ecan.mapviewer.map.enableMapNavigation();
    ecan.mapviewer.map.showZoomSlider();
}

ecan.mapviewer.toggleLocationTool = function (event) {
    var locbutton = dijit.byId('dijit_form_ToggleButton_2');

    // get the button state
    var locationOn = false;
    if (locbutton.checked)
        locationOn = true;

    if (locationOn) {
        ecan.mapviewer.setToolLabel("Measure Location Tool");

        // Clear active tools
        var areabutton = dijit.byId('dijit_form_ToggleButton_0');
        if (areabutton.checked)
            ecan.mapviewer.measurement.setTool('area', false);

        var linebutton = dijit.byId('dijit_form_ToggleButton_1');
        if (linebutton.checked)
            ecan.mapviewer.measurement.setTool('distance', false);

        // Force button to be checked
        locbutton.set('checked', true);

        // Hide the label
        var droplabel = dijit.byId('dijit_form_DropDownButton_0');
        droplabel.set('label', '');

        // Clear any existing measure graphics
        ecan.mapviewer.map.graphics.clear();

        // Enable the map popups again
        ecan.mapviewer.disablePopups();

        // Activate the draw tool
        ecan.mapviewer.locationToolbar.activate(esri.toolbars.Draw.POINT, { 'showTooltips': true });
    }
    else {
        ecan.mapviewer.setToolLabel("Pan Tool");

        // Deactivate the draw tool
        ecan.mapviewer.locationToolbar.deactivate();

        // Clear the map graphics
        ecan.mapviewer.map.graphics.clear();

        // Enable the map popups again
        ecan.mapviewer.enablePopups();
    }

    // Clear the measurement text
    $('#measurementTool > div.result').html('');
};

ecan.mapviewer.formatCoord = function (val) {
    return ecan.mapviewer.formatThousands(val.toFixed(0), ',');
}

ecan.mapviewer.formatThousands = function (value, separator) {
    var buf = [];
    value = String(value).split('').reverse();
    for (var i = 0; i < value.length; i++) {
        if (i % 3 === 0 && i !== 0) {
            buf.push(separator);
        }
        buf.push(value[i]);
    }
    return buf.reverse().join('');
}

/* LEGEND FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.refreshLegend = function () {
    //Set the map title
    $('#mapTitle').html(ecan.mapviewer.deferred.results[0].itemInfo.item.title);

    var ids = ecan.mapviewer.map.layerIds;

    // Get the legend box
    var legend = $("#operationalLayersLegend");

    // Clear the existing info
    legend.html('');

    var layerid, layer, mapservicelist = [];

    $.each(ids, function () {
        layerid = this;
        layer = ecan.mapviewer.map.getLayer(layerid);

        // Check for the basemap
        if (layer.url != ecan.mapviewer.basemapurl) {
            // Create the legend for this layer
            ecan.mapviewer.buildLegend(layer);

            //Add url to the map service list for popup check
            mapservicelist.push({ "layerurl": layer.url, "layerid": layerid });
        }
    });

    ids = ecan.mapviewer.map.graphicsLayerIds;

    $.each(ids, function () {
        layerid = this;
        layer = ecan.mapviewer.map.getLayer(layerid);

        if (layer.url != null) {

            var layerurl = layer.url.substring(0, layer.url.lastIndexOf("/"));

            // Check if this is a popup feature layer - the 
            var found = false;
            $.each(mapservicelist, function () {
                // Check the layer url
                if (this.layerurl == layerurl) {
                    found = true;
                    return false;
                }
            });

            // Check for the basemap
            if (found == false && layer.url != null && layer.url != ecan.mapviewer.basemapurl) {
                // Create the legend for this layer
                ecan.mapviewer.buildLegend(layer);
            }
        }
    });

    ecan.mapviewer.redrawLegend();
};

ecan.mapviewer.redrawLegend = function () {
    $.each(ecan.mapviewer.mapLayers, function (key, value) {
        var dv = $("#layer" + key);

        // Append the visibility checkbox
        var html = '<div onclick="ecan.mapviewer.showhideLegend(' + "'" + key + "'" + ', this)" class="legendCollapse" title="Click to expand/collapse legend"></div><input type="checkbox" value="' + key + '" title="Hide/Show this layer" ';

        if (value.layer.visible) {
            html += 'checked="checked" ';
        }
        html += ' onclick="ecan.mapviewer.changeVisible(' + "'" + key + "'" + ')" class="visibleCheck" layerid="' + key + '" />';

        // Append the title
        html += '<span class="layerName">' + value.title.replace(/_/g, " ") + '</span><br />';

        var isDynamic = value.isDynamic;
        var visibleLayers;
        if (isDynamic) {
            visibleLayers = value.layer.visibleLayers;
        }

        html += '<table style="margin-top: 5px;" ><tbody>';

        var sid;

        if (value.isFeature == true) {
            sid = value.layerindex;

            // Get the sub layer details for this object
            $.each(value.sublayers, function () {

                if (this.layerId == sid) {
                    // Get the number of legend items
                    if (this.legend.length == 1) {
                        html += '<tr class="layerName layerItem" layerid="' + key + '" sublayerid="' + sid + '" title="Click to make this the active layer\nDouble click to show info about layer" ><td class="legendcheck indent">';

                        html += '</td><td>';

                        if (this.legend[0].label == '') {
                            html += this.layerName.replace(/_/g, " ") + '</td>';
                        }
                        else {
                            html += this.legend[0].label.replace(/_/g, " ") + '</td>';
                        }
                        html += '<td class="legendswatch"><img src="' + value.layer.url + '/images/' + this.legend[0].url + '" alt="Legend" /></td></tr>';
                    }
                    else {
                        // Append the legend items
                        $.each(this.legend, function () {
                            html += '<tr class="layerName sublayerItem" layerid="' + key + '" sublayerid="' + sid + '" ><td class="legendcheck indent"></td><td>' + this.label.replace(/_/g, " ") + '</td><td class="legendswatch"><img src="' + value.layer.url + '/images/' + this.url + '" alt="Legend" /></td></tr>';
                        });
                    }
                }
            });
        }
        else {
            // Add the sublayer options
            $.each(value.sublayers, function () {
                sid = this.layerId;

                // Get the number of legend items
                if (this.legend.length == 1) {
                    html += '<tr class="layerName layerItem" layerid="' + key + '" sublayerid="' + sid + '" title="Click to make this the active layer\nDouble click to show info about layer" ><td class="legendcheck indent">';

                    if (isDynamic) {
                        html += '<input type="checkbox" title="Hide/Show this layer" ';
                        if (visibleLayers.indexOf(this.layerId) >= 0) {
                            html += 'checked="checked" ';
                        }
                        html += ' onclick="ecan.mapviewer.changeVisible(' + "'" + key + "', " + sid + ')" class="visibleCheck" parentlayerid="' + key + '" sublayerid="' + sid + '" />';
                    }
                    html += '</td><td>';

                    if (this.legend[0].label == '') {
                        html += this.layerName.replace(/_/g, " ") + '</td>';
                    }
                    else {
                        html += this.legend[0].label.replace(/_/g, " ") + '</td>';
                    }
                    html += '<td class="legendswatch" ><img src="' + value.layer.url + '/' + sid + '/images/' + this.legend[0].url + '" alt="Legend" /></td></tr>';
                }
                else {

                    html += '<tr class="layerName layerItem" layerid="' + key + '" sublayerid="' + sid + '" title="Click to make this the active layer\nDouble click to show info about layer" ><td class="legendcheck indent">';

                    if (isDynamic) {
                        html += '<input type="checkbox" title="Hide/Show this layer" ';
                        if (visibleLayers.indexOf(this.layerId) >= 0) {
                            html += 'checked="checked" ';
                        }
                        html += ' onclick="ecan.mapviewer.changeVisible(' + "'" + key + "', " + sid + ')" class="visibleCheck" parentlayerid="' + key + '" sublayerid="' + sid + '" />';
                    }

                    // Append the sublayer name
                    html += '</td><td colspan="2" class="layerName" >' + this.layerName.replace(/_/g, " ") + '</td></tr>';

                    // Append the legend items
                    $.each(this.legend, function () {
                        html += '<tr class="layerName sublayerItem" layerid="' + key + '" sublayerid="' + sid + '" title="Click to make this the active layer\nDouble click to show info about layer" ><td class="legendcheck"></td><td>' + this.label.replace(/_/g, " ") + '</td><td class="legendswatch"><img src="' + value.layer.url + '/' + sid + '/images/' + this.url + '" alt="Legend" /></td></tr>';
                    });
                }
            });
        }

        html += '</tbody></table>';

        // Update the items
        dv.html(html).removeClass('loading');

        // Apply row click action
        $(".layerItem,.sublayerItem").unbind('click.row');
        $(".layerItem,.sublayerItem").bind('click.row', function () {
            var layerid = this.attributes['layerid'].value;
            var sublayerid = this.attributes['sublayerid'].value;

            // Clear selected object
            $('.layerItem,.sublayerItem').removeClass('active');

            // Set this and any subitems as active
            $('.layerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');
            $('.sublayerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');

            // Set the active layer object
            ecan.mapviewer.setActiveLayer(layerid, sublayerid);
        });

        // Apply row dblclick action
        $(".layerItem,.sublayerItem").unbind('dblclick.row');
        $(".layerItem,.sublayerItem").bind('dblclick.row', function () {
            var layerid = this.attributes['layerid'].value;
            var sublayerid = this.attributes['sublayerid'].value;
            var layer = ecan.mapviewer.mapLayers[layerid];

            // Create the metadata url
            var url = layer.layer.url;

            if (sublayerid != null && !layer.isFeature) {
                url += "/" + sublayerid;
            }

            // Open the arcgis layer rest page
            window.open(url);
        });
    });

    // refresh tabs for height
    $("#sidebarTabs").tabs({ heightStyle: "fill" });
};

ecan.mapviewer.buildLegend = function (layer) {
    var url = layer.url;
    var id = layer.id;

    // Get the legend box
    var legend = $("#operationalLayersLegend");

    // Add a div for the legend items
    legend.prepend('<div class="legendItem loading" id="layer' + id + '"></div>');

    // Check if layer is in the maplayers object
    if (ecan.mapviewer.mapLayers[id] == null) {
        switch (layer.declaredClass) {
            case "esri.layers.ArcGISTiledMapServiceLayer":
                // Tiled layer
                ecan.mapviewer.requestLegend(layer, url, false);
                break;

            case "esri.layers.ArcGISDynamicMapServiceLayer":
                // Dynamic Layer
                ecan.mapviewer.requestLegend(layer, url, true);
                break;

            case "esri.layers.FeatureLayer":
                // Feature Layer
                ecan.mapviewer.populateFeatureLegend(layer);
                break;

            case "esri.layers.WMSLayer":
                // WMS Layer
                ecan.mapviewer.populateWMSLegend(layer);
                break;

            default:
                alert("Unsupported Layer Type");
                break;
        }
    }
};

ecan.mapviewer.requestLegend = function (layer, url, isDynamic) {
    $.ajax({
        url: url + '/legend',
        data: {
            f: 'json',
            pretty: true
        },
        type: 'GET',
        dataType: 'jsonp',
        success: function (data) {
            var agsProps = layer.arcgisProps;
            ecan.mapviewer.mapLayers[layer.id] = {
                layer: layer,
                title: agsProps.title,
                isDynamic: isDynamic,
                isFeature: false,
                sublayers: data.layers
            };

            ecan.mapviewer.redrawLegend();
            ecan.mapviewer.repopulateActiveLayerList();
        },
        error: function (data) {
            alert(data.toString());
        }
    });
};

ecan.mapviewer.populateFeatureLegend = function (layer) {
    // Set the url
    var fullurl = layer.url;

    // Strip off the id to get the map server name
    var url = fullurl.substring(0, fullurl.lastIndexOf("/"));
    var layerindex = fullurl.substring(fullurl.lastIndexOf("/") + 1);

    $.ajax({
        url: url + '/legend',
        data: {
            f: 'json',
            pretty: true
        },
        type: 'GET',
        dataType: 'jsonp',
        success: function (data) {
            // Get the feature 
            ecan.mapviewer.mapLayers[layer.id] = {
                layer: layer,
                title: layer.name,
                isDynamic: false,
                isFeature: true,
                layerindex: layerindex,
                sublayers: data.layers
            };

            ecan.mapviewer.redrawLegend();
            ecan.mapviewer.repopulateActiveLayerList();
        },
        error: function (data) {
            alert(data.toString());
        }
    });
};

ecan.mapviewer.populateWMSLegend = function (layer) {
    ecan.mapviewer.mapLayers[layer.id] = {
        layer: layer,
        title: layer.title,
        isDynamic: false,
        isFeature: false,
        sublayers: []
    };
};

ecan.mapviewer.changeVisible = function (layername, layerid) {
    var layer = ecan.mapviewer.map.getLayer(layername);

    if (layerid == null) {
        layer.setVisibility(!layer.visible);
    }
    else {
        // Changing the sublayer visibility
        var index = layer.visibleLayers.indexOf(layerid);
        var layers = [];
        var i, il;

        if (index >= 0) {
            // Turn layer off
            for (i = 0, il = layer.visibleLayers.length; i < il; i++) {
                if (layer.visibleLayers[i] != layerid) {
                    layers.push(layer.visibleLayers[i]);
                }
            }
        }
        else {
            // Turn layer on
            for (i = 0, il = layer.visibleLayers.length; i < il; i++) {
                layers.push(layer.visibleLayers[i]);
            }
            layers.push(layerid);
        }

        if (layers.length > 0) {
            layer.setVisibleLayers(layers.sort(), false);
            layer.setVisibility(true);

            // Update the visibility of the mainlayer checkbox
            $('.visibleCheck[layerid="' + layername + '"]').attr('checked', true);
        }
        else {
            layer.setVisibleLayers([], false);
            layer.setVisibility(false);

            // Update the visibility of the mainlayer checkbox
            $('.visibleCheck[layerid="' + layername + '"]').attr('checked', true);
        }
    }
};

ecan.mapviewer.showhideLegend = function (layerName, legendGroup) {
    if ($(legendGroup).hasClass('legendCollapse')) {
        $(legendGroup).removeClass('legendCollapse').addClass('legendExpand').parent().addClass('legendCollapsed');
    }
    else {
        $(legendGroup).removeClass('legendExpand').addClass('legendCollapse').parent().removeClass('legendCollapsed');;
    }
};

ecan.mapviewer.showhideLegendAll = function (optionMethod) {
    if (optionMethod == 'collapse') {
        $('.legendItem').addClass('legendCollapsed').children('.legendCollapse').addClass('legendExpand').removeClass('legendCollapse');

    }
    else {
        $('.legendItem').removeClass('legendCollapsed').children('.legendExpand').addClass('legendCollapse').removeClass('legendExpand');
    }
};

ecan.mapviewer.showhideLayersAll = function (optionMethod) {
    var layer = null;
    if (optionMethod == 'show') {
        $('.visibleCheck').each(function () {
            if ($(this).attr('sublayerid') == undefined) {
                $(this).attr('checked', true);
            }
        });
        $.each(ecan.mapviewer.map.layerIds, function () {
            layer = ecan.mapviewer.map.getLayer(this);

            // Check if this is the base map
            if (layer.url != ecan.mapviewer.basemapurl) {
                layer.setVisibility(true);
            }
        });
    }
    else {
        $('.visibleCheck').each(function () {
            if ($(this).attr('sublayerid') == undefined) {
                $(this).attr('checked', false);
            }
        });
        $.each(ecan.mapviewer.map.layerIds, function () {
            layer = ecan.mapviewer.map.getLayer(this);

            // Check if this is the base map
            if (layer.url != ecan.mapviewer.basemapurl) {
                layer.setVisibility(false);
            }
        });
    }
};


/* DRAWING FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.createDrawingTools = function (showTools) {
    // Prepare the ui settings

    // Apply the font choices
    $('.fontType').html('').each(function () {
        var il = config.labelfonts.length;
        for (var i = 0; i < il; i++) {
            var opt = config.labelfonts[i];
            $(this).append(ecan.mapviewer.prepareListOption(opt));
        }
    }).change(function () { ecan.mapviewer.updateTextSymbol(); });

    // Apply the colour choices
    $('.fontColour').html('').each(function () {
        var il = config.drawingcolours.length;
        for (var i = 0; i < il; i++) {
            var col = config.drawingcolours[i];
            $(this).append(ecan.mapviewer.prepareListOption(col));
        }
    }).change(function () { ecan.mapviewer.updateTextSymbol(); });

    // Apply the font size choices
    $('.fontSize').html('').each(function () {
        var il = config.fontSizes.length;
        for (var i = 0; i < il; i++) {
            var opt = config.fontSizes[i];
            $(this).append(ecan.mapviewer.prepareListOption(opt));
        }
    }).change(function () { ecan.mapviewer.updateTextSymbol(); });

    // Apply the font styles choices
    $('.fontStyle').html('').each(function () {
        var il = config.fontStyles.length;
        for (var i = 0; i < il; i++) {
            var opt = config.fontStyles[i];
            $(this).append(ecan.mapviewer.prepareListOption(opt));
        }
    }).change(function () { ecan.mapviewer.updateTextSymbol(); });

    // Apply the rotation choices
    $('.labelRotation').html('').each(function () {
        var il = config.labelRotation.length;
        for (var i = 0; i < il; i++) {
            var opt = config.labelRotation[i];
            $(this).append(ecan.mapviewer.prepareListOption(opt));
        }
    }).change(function () { ecan.mapviewer.updateTextSymbol(); });


    // Prepare the drawing toolbar
    if (ecan.mapviewer.drawToolbar == null) {
        ecan.mapviewer.drawToolbar = new esri.toolbars.Draw(ecan.mapviewer.map);
        dojo.connect(ecan.mapviewer.drawToolbar, "onDrawEnd", ecan.mapviewer.drawToolEnd);
    }

    // Prepare the edit toolbar
    if (ecan.mapviewer.editToolbar == null) {
        // Create and setup editing tools
        ecan.mapviewer.editToolbar = new esri.toolbars.Edit(ecan.mapviewer.map);
        dojo.connect(ecan.mapviewer.map, "onClick", function (evt) {
            ecan.mapviewer.editToolbar.deactivate();
        });

        // Connect move finish event
        dojo.connect(ecan.mapviewer.editToolbar, "onGraphicMoveStop", ecan.mapviewer.graphicMoveComplete);

        // Prepare the context menus for the map - disabled as not adding anything at this stage 
        //ecan.mapviewer.createMapMenu();

        // Prepare the context menu for the graphics 
        ecan.mapviewer.createGraphicsMenu();

        // Enable the long press on the mobile devices
        if (isMobile.any()) {
            ecan.mapviewer.enableGraphicsMenuEvents();
            ecan.mapviewer.graphicsLayer.enableMouseEvents();
        }
    }

    if (showTools == null) {
        // Show the drawing tools
        $('#drawingContainer').show();
    }
};

ecan.mapviewer.prepareListOption = function (opt) {
    var html = '';
    if (opt) {
        html += '<option value="' + opt["value"] + '"';

        if (opt["style"] != null) {
            html += ' style="' + opt["style"] + '"';
        }

        if (opt["selected"] != null) {
            html += ' selected="' + opt["selected"] + '"';
        }

        html += '>' + opt["label"] + '</option>';
    }
    return html;
};

ecan.mapviewer.createMapMenu = function () {
    // Creates right-click context menu for map
    ecan.mapviewer.ctxMenuForMap = new dijit.Menu({
        onOpen: function (box) {
            // Lets calculate the map coordinates where user right clicked.
            // We'll use this to create the graphic when the user clicks on the menu item to "Add Point"
            currentLocation = ecan.mapviewer.getMapPointFromMenuPosition(box);
            ecan.mapviewer.editToolbar.deactivate();
        }
    });

    ecan.mapviewer.ctxMenuForMap.addChild(new dijit.MenuItem({
        label: "Add Point",
        onClick: function (evt) {
            var symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 30, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([200, 235, 254, 0.9]), 2), new dojo.Color([200, 235, 254, 0.5]));
            var graphic = new esri.Graphic(esri.geometry.fromJson(currentLocation.toJson()), symbol);
            ecan.mapviewer.graphicsLayer.add(graphic);
        }
    }));

    ecan.mapviewer.ctxMenuForMap.startup();
    ecan.mapviewer.ctxMenuForMap.bindDomNode(ecan.mapviewer.map.container);
};

ecan.mapviewer.createGraphicsMenu = function () {
    // Creates right-click context menu for GRAPHICS
    ecan.mapviewer.ctxMenuForGraphics = new dijit.Menu({});

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Edit Shape",
        onClick: function () {
            if (ecan.mapviewer.selectedGraphic.geometry.type !== "point") {
                ecan.mapviewer.deactivateDrawTool();

                ecan.mapviewer.editToolbar.activate(esri.toolbars.Edit.EDIT_VERTICES, ecan.mapviewer.selectedGraphic);
            }
            else {
                alert("The shape for a label or point graphic cannot be edited.");
            }
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Move",
        onClick: function () {
            ecan.mapviewer.deactivateDrawTool();

            ecan.mapviewer.editToolbar.activate(esri.toolbars.Edit.MOVE, ecan.mapviewer.selectedGraphic);
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Rotate/Scale",
        onClick: function () {
            if (ecan.mapviewer.selectedGraphic.geometry.type !== "point") {
                ecan.mapviewer.deactivateDrawTool();

                ecan.mapviewer.editToolbar.activate(esri.toolbars.Edit.ROTATE | esri.toolbars.Edit.SCALE, ecan.mapviewer.selectedGraphic);
            }
            else {
                alert("The shape for a label and point graphics cannot be rotated.");
            }
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Style",
        onClick: function () {
            ecan.mapviewer.showStyleDialog();
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuSeparator());
    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Measurement Properties",
        onClick: function () {
            ecan.mapviewer.showMeasurementsDialog();
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuSeparator());
    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Buffer",
        onClick: function () {
            ecan.mapviewer.showBufferDialog('graphic');
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuSeparator());
    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Delete",
        onClick: function () {
            ecan.mapviewer.graphicsLayer.remove(ecan.mapviewer.selectedGraphic);
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuSeparator());
    ecan.mapviewer.ctxMenuForGraphics.addChild(new dijit.MenuItem({
        label: "Select Features in Active Layer",
        onClick: function () {
            var geometry = ecan.mapviewer.selectedGraphic.geometry;
            ecan.mapviewer.searchByGeometry(geometry);
        }
    }));

    ecan.mapviewer.ctxMenuForGraphics.startup();

    dojo.connect(ecan.mapviewer.graphicsLayer, "onMouseOver", function (evt) {
        // We'll use this "selected" graphic to enable editing tools
        // on this graphic when the user click on one of the tools listed in the menu.
        ecan.mapviewer.selectedGraphic = evt.graphic;

        // Let's bind to the graphic underneath the mouse cursor           
        ecan.mapviewer.ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
    });


    dojo.connect(ecan.mapviewer.graphicsLayer, "onMouseOut", function (evt) {
        ecan.mapviewer.ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
    });
}

ecan.mapviewer.enableGraphicsMenuEvents = function () {
    dojo.connect(ecan.mapviewer.graphicsLayer, "onMouseDown", ecan.mapviewer.graphicsLayerMouseDownHandler);
    dojo.connect(ecan.mapviewer.graphicsLayer, "onMouseUp", ecan.mapviewer.graphicsLayerMouseUpHandler);
};


ecan.mapviewer.pressGraphicsTimer = null;
ecan.mapviewer.pressGraphic = null

ecan.mapviewer.graphicsLayerMouseDownHandler = function (event) {

    ecan.mapviewer.pressGraphic = event.graphic;
    ecan.mapviewer.graphicsPressTimer = window.setTimeout(function () {
        var node = ecan.mapviewer.pressGraphic.getDojoShape().getNode();

        if (dojo.isIE) {
            node.fireEvent("oncontextmenu", document.createEventObject());
        }
        else {
            var evt = document.createEvent("PopupEvents");
            evt.initMouseEvent("contextmenu", true, true, window, 0, 0, 0,
                 0, 0, false, false, false, false, 0, null);
            node.dispatchEvent(evt);
        }
    }, 1000)
};

ecan.mapviewer.graphicsLayerMouseUpHandler = function (event) {
    clearTimeout(ecan.mapviewer.pressGraphicsTimer)
};


ecan.mapviewer.getMapPointFromMenuPosition = function (box) {
    var x = box.x, y = box.y;

    switch (box.corner) {
        case "TR":
            x += box.w;
            break;
        case "BL":
            y += box.h;
            break;
        case "BR":
            x += box.w;
            y += box.h;
            break;
    }

    var screenPoint = new esri.geometry.Point(x - ecan.mapviewer.map.position.x, y - ecan.mapviewer.map.position.y);
    return ecan.mapviewer.map.toMap(screenPoint);
}

ecan.mapviewer.buildCircle = function (geom) {
    var p1, p2, radius, circle, ring, pts, angle;

    if (geom.paths[0].length != 2) {
        alert("Need exactly two points to draw a circle.");
        return;
    }

    p1 = geom.paths[0][0]; // circle center
    p2 = geom.paths[0][1]; // point on the circle
    radius = Math.pow((Math.pow((p2[0] - p1[0]), 2) + Math.pow((p2[1] - p1[1]), 2)), 0.5);
    circle = new esri.geometry.Polygon(geom.spatialReference);
    ring = []; // point that make up the circle
    pts = 40; // number of points on the circle
    angle = 360 / pts; // used to compute points on the circle
    for (var i = 1; i <= pts; i++) {
        // convert angle to radians
        var radians = i * angle * Math.PI / 180;
        // add point to the circle
        ring.push([p1[0] + radius * Math.cos(radians), p1[1] + radius * Math.sin(radians)]);
    }
    ring.push(ring[0]); // start point needs to == end point
    circle.addRing(ring);
    return circle;
}

ecan.mapviewer.prepareLabelDialog = function () {
    $('#textDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        title: "Enter Label Text",
        height: 200,
        buttons: {
            "Add Label": function () {
                ecan.mapviewer.addTextGraphic(ecan.mapviewer.labelPoint, $('#labeltext').val());
                $(this).dialog("close");
            },
            "Cancel": function () {
                $(this).dialog("close");
            }
        },
        open: function () {
            $('#labeltext').val('');
        }
    }).removeClass('hidden');
};

ecan.mapviewer.prepareSymbols = function (symboltype) {
    $('#textsymbolSettingsContainer').hide();

    // Update the last symbol type
    ecan.mapviewer.lastDrawSymbolType = symboltype;

    // Clear symbol list
    ecan.mapviewer.symbols = ecan.mapviewer.generateSymbols(symboltype);

    // Prepare the template picker if not already set
    if (ecan.mapviewer.templatePicker == null) {
        // Prepare the template picker
        ecan.mapviewer.templatePicker = new esri.dijit.editing.TemplatePicker({
            items: ecan.mapviewer.symbols,
            rows: "auto",
            columns: 3,
            showTooltip: false,
            style: "height: 100%; width: 100%;"
        }, "symbolSettingsContainer");

        ecan.mapviewer.templatePicker.startup();

        // Add listeners for template selection
        dojo.connect(ecan.mapviewer.templatePicker, "onSelectionChange", function () {
            // Deactivate the draw tool
            ecan.mapviewer.drawToolbar.deactivate();

            // Check for the selected template
            var selectedTemplate = ecan.mapviewer.templatePicker.getSelected();
            if (selectedTemplate != null && ecan.mapviewer.currentDrawTool != null) {
                // Activate the draw tool                
                ecan.mapviewer.drawToolbar.activate(ecan.mapviewer.currentDrawTool);
            }
        });
    }
    else {
        $('#symbolSettingsContainer').show();
        ecan.mapviewer.templatePicker.attr("items", ecan.mapviewer.symbols);
        ecan.mapviewer.templatePicker.update();
    }
};

ecan.mapviewer.generateSymbols = function (symboltype) {
    var symbols = [];

    // Prepare point symbols
    var i, j, k, sym, out, outline, style, siz, col, stylename, sizename, colname, alpha, alphaname;

    // Prepare outline symbol
    outline = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 0]), 2);

    // Check symbol type
    switch (symboltype) {
        case "point":
            // Generate array of new symbols
            for (i = 0; i < 3; i++) {
                // Set the style type
                switch (i) {
                    case 0:
                        style = esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE;
                        stylename = "Circle";
                        out = outline;
                        break;

                    case 1:
                        style = esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND;
                        stylename = "Diamond";
                        out = outline;
                        break;

                    case 2:
                        style = esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE;
                        stylename = "Square";
                        out = outline;
                        break;
                }

                for (j = 0; j < 5; j++) {
                    // Set the symbol colour
                    switch (j) {
                        case 0:
                            col = new dojo.Color([0, 0, 0]);
                            colname = "Black";
                            break;

                        case 1:
                            col = new dojo.Color([255, 0, 0]);
                            colname = "Red";
                            break;

                        case 2:
                            col = new dojo.Color([255, 255, 0]);
                            colname = "Yellow";
                            break;

                        case 3:
                            col = new dojo.Color([0, 255, 0]);
                            colname = "Green";
                            break;

                        case 4:
                            col = new dojo.Color([0, 0, 255]);
                            colname = "Blue";
                            break;
                    }

                    for (k = 1; k <= 3; k++) {
                        // Set the marker size
                        switch (k) {
                            case 1:
                                siz = 10;
                                sizename = "Small";
                                break;

                            case 2:
                                siz = 15;
                                sizename = "Medium";
                                break;

                            case 3:
                                siz = 20;
                                sizename = "Large";
                                break;
                        }

                        // Create the symbol;
                        symbols.push(
                            {
                                label: sizename + " " + colname + " " + stylename,
                                symbol: new esri.symbol.SimpleMarkerSymbol(style, siz, outline, col),
                                description: ""
                            });
                    }
                }
            }
            col = new dojo.Color([0, 0, 0, 0]);

            // Add the non coloured symbols
            symbols.push(
                            {
                                label: "Small Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 10, outline, col),
                                description: ""
                            });


            symbols.push(
                            {
                                label: "Medium Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 15, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Large Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 20, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Small Diagonal Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 10, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Medium Diagonal Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 15, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Large Diagonal Cross",
                                symbol: new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_X, 20, outline, col),
                                description: ""
                            });
            break;

        case "line":
            // Generate array of new symbols
            for (i = 0; i < 3; i++) {
                // Set the style type
                switch (i) {
                    case 0:
                        style = esri.symbol.SimpleLineSymbol.STYLE_SOLID;
                        stylename = "Solid Line";
                        break;

                    case 1:
                        style = esri.symbol.SimpleLineSymbol.STYLE_DASH;
                        stylename = "Dashed Line";
                        break;

                    case 2:
                        style = esri.symbol.SimpleLineSymbol.STYLE_DOT;
                        stylename = "Dotted Line";
                        break;
                }

                for (j = 0; j < 5; j++) {
                    // Set the symbol colour
                    switch (j) {
                        case 0:
                            col = new dojo.Color([0, 0, 0]);
                            colname = "Black";
                            break;

                        case 1:
                            col = new dojo.Color([255, 0, 0]);
                            colname = "Red";
                            break;

                        case 2:
                            col = new dojo.Color([255, 255, 0]);
                            colname = "Yellow";
                            break;

                        case 3:
                            col = new dojo.Color([0, 255, 0]);
                            colname = "Green";
                            break;

                        case 4:
                            col = new dojo.Color([0, 0, 255]);
                            colname = "Blue";
                            break;
                    }

                    for (k = 1; k <= 3; k++) {
                        // Set the marker size
                        switch (k) {
                            case 1:
                                siz = 1;
                                sizename = "Thin";
                                break;

                            case 2:
                                siz = 3;
                                sizename = "Regular";
                                break;

                            case 3:
                                siz = 5;
                                sizename = "Heavy";
                                break;
                        }

                        // Create the symbol;
                        symbols.push(
                            {
                                label: sizename + " " + colname + " " + stylename,
                                symbol: new esri.symbol.SimpleLineSymbol(style, col, siz),
                                description: ""
                            });
                    }
                }
            }
            break;

        case 'poly':
            // Generate array of new symbols
            style = esri.symbol.SimpleFillSymbol.STYLE_SOLID;
            stylename = "Solid";
            out = outline;

            for (i = 0; i < 4; i++) {
                // Set the style transparency level
                switch (i) {
                    case 0:
                        alpha = 1;
                        alphaname = "100% Solid";
                        break;

                    case 1:
                        alpha = 0.75;
                        alphaname = "75% Solid";
                        break;

                    case 2:
                        alpha = 0.5;
                        alphaname = "50% Solid";
                        break;

                    case 3:
                        alpha = 0.25;
                        alphaname = "25% Solid";
                        break;
                }

                for (j = 0; j < 7; j++) {
                    // Set the symbol colour
                    switch (j) {
                        case 0:
                            col = new dojo.Color([0, 0, 0, alpha]);
                            colname = "Black";
                            break;

                        case 1:
                            col = new dojo.Color([255, 0, 0, alpha]);
                            colname = "Red";
                            break;

                        case 2:
                            col = new dojo.Color([255, 140, 0, alpha]);
                            colname = "Orange";
                            break;

                        case 3:
                            col = new dojo.Color([255, 255, 0, alpha]);
                            colname = "Yellow";
                            break;

                        case 4:
                            col = new dojo.Color([0, 255, 0, alpha]);
                            colname = "Green";
                            break;

                        case 5:
                            col = new dojo.Color([153, 0, 211, alpha]);
                            colname = "Indigo";
                            break;

                        case 6:
                            col = new dojo.Color([0, 0, 255, alpha]);
                            colname = "Blue";
                            break;
                    }

                    // Create the symbol;
                    symbols.push(
                            {
                                label: alphaname + " " + colname,
                                symbol: new esri.symbol.SimpleFillSymbol(style, outline, col),
                                description: ""
                            });

                }
            }

            // Add the outline only symbol
            symbols.push(
                            {
                                label: "Vertical Stripes",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_VERTICAL, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Horizontal Stripes",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_HORIZONTAL, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Forward Diagonal Stripes",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_FORWARD_DIAGONAL, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Backward Diagonal Stripes",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_BACKWARD_DIAGONAL, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Cross",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_CROSS, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Diagonal Cross",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_DIAGONAL_CROSS, outline, col),
                                description: ""
                            });

            symbols.push(
                            {
                                label: "Outline Only",
                                symbol: new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_NULL, outline, col),
                                description: ""
                            });

            break;
    }

    return symbols;
};

ecan.mapviewer.prepareTextSymbol = function () {
    // Get the current symbol
    if (ecan.mapviewer.textsymbol == null) {
        ecan.mapviewer.textsymbol = new esri.symbol.TextSymbol("")
            .setColor(new dojo.Color([0, 0, 0]))
            .setAlign(esri.symbol.Font.ALIGN_START)
            .setFont(new esri.symbol.Font(12)
            .setWeight(esri.symbol.Font.WEIGHT_BOLD));
    }
    $('#symbolSettingsContainer').hide();
    $('#textsymbolSettingsContainer').show();
    ecan.mapviewer.lastDrawSymbolType = 'text';
};

ecan.mapviewer.activateDrawTool = function (tool) {
    // Clear the active tool
    ecan.mapviewer.clearActiveTool();

    // Deactivate the popups
    ecan.mapviewer.disablePopups();

    // Clear the active tool
    $('.drawtool').removeClass('active');

    if (ecan.mapviewer.templatePicker != null) {
        ecan.mapviewer.templatePicker.clearSelection();
    }

    // Set the tool
    switch (tool) {
        case "point":
            $('#drawPoint').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Point Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'point') {
                ecan.mapviewer.prepareSymbols('point');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POINT;
            break;

        case "line":
            $('#drawLine').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Line Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'line') {
                ecan.mapviewer.prepareSymbols('line');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POLYLINE;
            break;

        case "freeline":
            $('#drawFreeLine').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Freehand Line Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'line') {
                ecan.mapviewer.prepareSymbols('line');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.FREEHAND_POLYLINE;
            break;

        case "polygon":
            $('#drawPolygon').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Polygon Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POLYGON;
            break;

        case "freepolygon":
            $('#drawFreePolygon').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Freehand Polygon Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.FREEHAND_POLYGON;
            break;

        case "circle":
            $('#drawCircle').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Circle Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            // Use line rather than esri circle tool - then call build circle function
            ecan.mapviewer.specialDrawTool = 'circle';
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.LINE;

            //ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.CIRCLE;
            break;

        case "ellipse":
            $('#drawEllipse').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Ellipse Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.ELLIPSE;
            break;

        case "rectangle":
            $('#drawRectangle').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Rectangle Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.EXTENT;
            break;

        case "arrow":
            $('#drawArrow').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Arrow Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.ARROW;
            break;

        case "triangle":
            $('#drawTriangle').addClass('active');
            ecan.mapviewer.setToolLabel('Draw Triangle Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'poly') {
                ecan.mapviewer.prepareSymbols('poly');
            }
            else {
                $('#symbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.TRIANGLE;
            break;

        case "text":
            $('#drawText').addClass('active');
            ecan.mapviewer.setToolLabel('Add Text Tool');
            if (ecan.mapviewer.lastDrawSymbolType != 'text') {
                ecan.mapviewer.prepareTextSymbol();
            }
            else {
                $('#textsymbolSettingsContainer').show();
            }
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POINT;

            // Activate the draw tool
            ecan.mapviewer.drawToolbar.activate(ecan.mapviewer.currentDrawTool);
            break;
    }
};

ecan.mapviewer.deactivateDrawTool = function () {
    if (ecan.mapviewer.drawToolbar != null) {
        ecan.mapviewer.drawToolbar.deactivate();
        ecan.mapviewer.currentDrawTool = null;
    }

    if (ecan.mapviewer.templatePicker != null) {
        ecan.mapviewer.templatePicker.clearSelection();
        $('#symbolSettingsContainer').hide();
    }

    // Hide the text label tools
    $('#textsymbolSettingsContainer').hide();
};

ecan.mapviewer.stopDrawing = function () {
    ecan.mapviewer.drawToolbar.finishDrawing();

    if (ecan.mapviewer.drawMode == 'drawing') {
        ecan.mapviewer.clearActiveTool();
    }
};

ecan.mapviewer.drawToolEnd = function (geometry) {
    // Check for current mode
    switch (ecan.mapviewer.drawMode) {
        case "identify":
            ecan.mapviewer.searchByGeometry(geometry);
            break;

        case "drawing":
            if (ecan.mapviewer.lastDrawSymbolType == 'text') {
                ecan.mapviewer.addTextGraphic(geometry);
            }
            else {
                ecan.mapviewer.addGraphic(geometry);
            }
            break;
    }
};

ecan.mapviewer.addGraphic = function (geometry) {
    if (geometry.type == 'extent') {
        // Convert to polygon
        var poly = ecan.mapviewer.extentToPolygon(geometry);
        geometry = poly;
    }

    var selectedTemplate = ecan.mapviewer.templatePicker.getSelected();
    if (selectedTemplate) {
        switch (ecan.mapviewer.specialDrawTool) {
            case 'circle':
                geometry = ecan.mapviewer.buildCircle(geometry);
                break;

            default:
                // Do nothing
                break;
        }

        var symbol = selectedTemplate.item.symbol;
        var graphic = new esri.Graphic(geometry, symbol);
        ecan.mapviewer.graphicsLayer.add(graphic);
    }
};

ecan.mapviewer.addTextGraphic = function (geometry, text) {
    var point;
    if (geometry.type != 'point') {
        point = geometry.getExtent().getCenter();
    }
    else {
        point = geometry;
    }

    // Check if text has been supplied
    if (text != null) {
        // Duplicate the current text symbol
        var symbol = new esri.symbol.TextSymbol(ecan.mapviewer.textsymbol.toJson()).setText(text);
        var graphic = new esri.Graphic(point, symbol);
        ecan.mapviewer.graphicsLayer.add(graphic);
        ecan.mapviewer.labelPoint = null;
    }
    else {
        // Save the point as a label point
        ecan.mapviewer.labelPoint = point;
        $('#textDialog').dialog('open');
    }
};

ecan.mapviewer.extentToPolygon = function (extent) {
    var poly = new esri.geometry.Polygon(new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid }));

    var ring = [];
    ring.push(new esri.geometry.Point(extent.xmin, extent.ymin, new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid })));
    ring.push(new esri.geometry.Point(extent.xmin, extent.ymax, new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid })));
    ring.push(new esri.geometry.Point(extent.xmax, extent.ymax, new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid })));
    ring.push(new esri.geometry.Point(extent.xmax, extent.ymin, new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid })));
    ring.push(new esri.geometry.Point(extent.xmin, extent.ymin, new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid })));

    poly.addRing(ring);

    return poly;
};

ecan.mapviewer.clearDrawnGraphics = function () {
    if (ecan.mapviewer.graphicsLayer.graphics.length > 0) {
        var answer = confirm('Are you sure you wish to clear the drawn graphics?');
        if (answer) {
            ecan.mapviewer.graphicsLayer.clear();
        }
    } else {
        alert('No Graphics To Remove');
    }
};

ecan.mapviewer.graphicMoveComplete = function (graphic, transform) {
    ecan.mapviewer.deactivateEditTool();
};

/* STYLE DIALOG FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.prepareStyleDialog = function () {
    // Setup the style dialog
    $('#styleDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        title: "Update Graphic Style",
        height: 300,
        buttons: {
            "Update": function () {
                if ($('#textStyleSettingsContainer').is(":visible")) {
                    // Update the selected graphic's text symbol
                    ecan.mapviewer.selectedGraphic.setSymbol(ecan.mapviewer.textsymbol);
                }
                else {
                    // Get the current selected template
                    var selectedTemplate = ecan.mapviewer.stylePicker.getSelected();

                    // Update the selected graphic's symbol
                    ecan.mapviewer.selectedGraphic.setSymbol(selectedTemplate.item.symbol);
                }
                // Close the style dialog
                $(this).dialog("close");
            },
            "Close": function () {
                $(this).dialog("close");
            }
        }
    }).removeClass('hidden');

    $('.ui-dialog-content').css('padding', '2px');
};

ecan.mapviewer.showStyleDialog = function () {
    // Check for a selected graphic
    if (ecan.mapviewer.selectedGraphic == null) {
        alert('There are no graphics selected at this time');
    }
    else {
        // Show the dialog
        $('#styleDialog').dialog('open');

        // Check if this is text graphic
        if (ecan.mapviewer.selectedGraphic.symbol.type == "textsymbol") {
            // Show the text style container
            $('#textStyleSettingsContainer').show();

            // Hide the geometry style container
            $('#styleSettingsContainer').hide();

            // Update the text style settings
            ecan.mapviewer.setTextStyle();
        }
        else {
            // Show the text style container
            $('#textStyleSettingsContainer').hide();

            // Hide the geometry style container
            $('#styleSettingsContainer').show();

            // Get the geometry type
            var symboltype;
            switch (ecan.mapviewer.selectedGraphic.geometry.type) {
                case "multipoint":
                case "point":
                    symboltype = "point";
                    break;

                case "extent":
                case "polygon":
                    symboltype = "poly";
                    break;

                case "polyline":
                    symboltype = "line";
                    break;
            }

            if (ecan.mapviewer.lastStyleType != symboltype) {
                // Generate the new symbols to match
                ecan.mapviewer.styles = ecan.mapviewer.generateSymbols(symboltype);

                // Update the symboltype
                ecan.mapviewer.lastStyleType = symboltype;
            }

            // Prepare the template picker if not already set
            if (ecan.mapviewer.stylePicker == null) {
                // Prepare the template picker
                ecan.mapviewer.stylePicker = new esri.dijit.editing.TemplatePicker({
                    items: ecan.mapviewer.styles,
                    rows: "auto",
                    columns: 3,
                    showTooltip: false,
                    style: "height: 100%; width: 270px; margin-left: auto; marging-right: auto;"
                }, "styleSettingsContainer");

                ecan.mapviewer.stylePicker.startup();

                // Add listeners for template selection
                dojo.connect(ecan.mapviewer.stylePicker, "onSelectionChange", function () {
                    // Check for the selected template
                    var selectedTemplate = ecan.mapviewer.stylePicker.getSelected();

                    if (selectedTemplate != null) {
                        // Enable the dialog update button
                        ecan.mapviewer.setStyleDialogState('templateselected');
                    }
                    else {
                        // Enable the dialog update button
                        ecan.mapviewer.setStyleDialogState('');
                    }
                });

                ecan.mapviewer.setStyleDialogState('');
            }
            else {
                // Update the styles
                $('#styleSettingsContainer').show();
                ecan.mapviewer.stylePicker.attr("items", ecan.mapviewer.styles);
                ecan.mapviewer.stylePicker.update();
                ecan.mapviewer.stylePicker.clearSelection();

                ecan.mapviewer.setStyleDialogState('');
            }
        }
    }
};

ecan.mapviewer.setStyleDialogState = function (state) {
    if (state != 'templateselected') {
        // Disable the button
        $(":button:contains('Update')").attr("disabled", "disabled").addClass('ui-state-disabled');
    }
    else {
        // Re-enable the Update button
        $(":button:contains('Update')").attr("disabled", null).removeClass('ui-state-disabled').removeClass('ui-state-focused');
    }
};

ecan.mapviewer.updateTextSymbol = function () {
    // Get the style dialog status
    var isOpen = $("#styleDialog").dialog("isOpen");

    var fntName, fntSize, style, width, fntStyle, colour, angle, labeltext;

    if (isOpen) {
        // Get settinsg from the style dialog
        fntName = $('#fontStyleSelect').val();
        fntSize = $('#fontStyleSizeSelect').val();
        fntStyle = $('#fontStyleStyle').val();
        colour = new dojo.Color($('#fontStyleColour').val());
        angle = Number($('#fontStyleRotation').val());
        labeltext = $('#labelStyleText').val();
    }
    else {
        // Get settings from the toolbox
        fntName = $('#fontSelect').val();
        fntSize = $('#fontSizeSelect').val();
        fntStyle = $('#fontStyle').val();
        colour = new dojo.Color($('#fontColour').val());
        angle = Number($('#fontRotation').val());
        labeltext = '';
    }

    // Update the settings
    $('.fontType').css('font-family', fntName);
    $('.fontSize').css('font-size', fntSize);

    switch (fntStyle) {
        case "Regular":
            $('.fontStyle').css({ 'font-weight': 'normal', 'font-style': 'normal' });
            style = esri.symbol.Font.STYLE_NORMAL;
            weight = esri.symbol.Font.WEIGHT_NORMAL;
            break;

        case "Bold":
            $('.fontStyle').css({ 'font-weight': 'bold', 'font-style': 'normal' });
            style = esri.symbol.Font.STYLE_NORMAL;
            weight = esri.symbol.Font.WEIGHT_BOLD;
            break;

        case "Italic":
            $('.fontStyle').css({ 'font-weight': 'normal', 'font-style': 'italic' });
            style = esri.symbol.Font.STYLE_ITALIC;
            weight = esri.symbol.Font.WEIGHT_NORMAL;
            break;

        case "BoldItalic":
            $('.fontStyle').css({ 'font-weight': 'bold', 'font-style': 'italic' });
            style = esri.symbol.Font.STYLE_ITALIC;
            weight = esri.symbol.Font.WEIGHT_BOLD;
            break;
    }

    // Update the font and symbol
    var fnt = new esri.symbol.Font().setFamily(fntName).setSize(fntSize).setWeight(weight).setStyle(style);
    ecan.mapviewer.textsymbol = new esri.symbol.TextSymbol("").setFont(fnt).setColor(colour).setAngle(angle).setText(labeltext);
};

ecan.mapviewer.updateTextStyle = function () {
    // Get the style dialog status
    var isOpen = $("#styleDialog").dialog("isOpen");

    var fntName, fntSize, style, width, fntStyle, colour, angle, labeltext;

    if (isOpen) {
        // Get settinsg from the style dialog
        fntName = $('#fontStyleSelect').val();
        fntSize = $('#fontStyleSizeSelect').val();
        fntStyle = $('#fontStyleStyle').val();
        colour = new dojo.Color($('#fontStyleColour').val());
        angle = Number($('#fontStyleRotation').val());
        labeltext = $('#labelStyleText').val();
    }
    else {
        // Get settings from the toolbox
        fntName = $('#fontSelect').val();
        fntSize = $('#fontSizeSelect').val();
        fntStyle = $('#fontStyle').val();
        colour = new dojo.Color($('#fontColour').val());
        angle = Number($('#fontRotation').val());
        labeltext = '';
    }

    // Update the settings
    $('.fontType').css('font-family', fntName);
    $('.fontSize').css('font-size', fntSize);

    switch (fntStyle) {
        case "Regular":
            $('.fontStyle').css({ 'font-weight': 'normal', 'font-style': 'normal' });
            style = esri.symbol.Font.STYLE_NORMAL;
            weight = esri.symbol.Font.WEIGHT_NORMAL;
            break;

        case "Bold":
            $('.fontStyle').css({ 'font-weight': 'bold', 'font-style': 'normal' });
            style = esri.symbol.Font.STYLE_NORMAL;
            weight = esri.symbol.Font.WEIGHT_BOLD;
            break;

        case "Italic":
            $('.fontStyle').css({ 'font-weight': 'normal', 'font-style': 'italic' });
            style = esri.symbol.Font.STYLE_ITALIC;
            weight = esri.symbol.Font.WEIGHT_NORMAL;
            break;

        case "BoldItalic":
            $('.fontStyle').css({ 'font-weight': 'bold', 'font-style': 'italic' });
            style = esri.symbol.Font.STYLE_ITALIC;
            weight = esri.symbol.Font.WEIGHT_BOLD;
            break;
    }

    // Update the font and symbol
    var fnt = new esri.symbol.Font().setFamily(fntName).setSize(fntSize).setWeight(weight).setStyle(style);
    ecan.mapviewer.textStyle = new esri.symbol.TextSymbol("").setFont(fnt).setColor(colour).setAngle(angle).setText(labeltext);
};

ecan.mapviewer.setTextStyle = function () {
    var symbol = ecan.mapviewer.selectedGraphic.symbol;

    if (symbol.type == 'textsymbol') {
        // Set the label text
        $('#labelStyleText').val(symbol.text);

        // Set the style
        var fnt = symbol.font;
        var bold = fnt.weight == esri.symbol.Font.WEIGHT_BOLD;
        var italic = fnt.style == esri.symbol.Font.STYLE_ITALIC;

        var style = "Regular";
        if (bold && !italic) {
            style = "Bold";
        }
        else if (!bold && italic) {
            style = "Italic";
        }
        else if (bold && italic) {
            style = "BoldItalic";
        }
        $('#fontStyleStyle').val(style);

        // Set the colour
        var col = symbol.color.toHex().toString().toUpperCase();
        $('#fontStyleColour').val(col);

        // Set the font family
        $('#fontStyleSelect').val(fnt.family);

        // Set the size
        $('#fontStyleSizeSelect').val(fnt.size);

        // Set the rotation
        $('#fontStyleRotation').val(symbol.angle)
    }
};


/* BUFFER DIALOG FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.prepareBufferDialog = function () {
    // Setup the buffer dialog
    $('#bufferDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        title: "Buffer Feaature",
        buttons: {
            "Buffer": function () {
                // Call the buffer function
                ecan.mapviewer.generateBuffer($('#bufferDistance').val());

                // Close the buffer dialog
                $(this).dialog("close");
            },
            "Close": function () {
                $(this).dialog("close");
            }
        }
    }).removeClass('hidden');

    $('#bufferDialogWorking').hide();

    $('.ui-dialog-content').css('padding', '2px');
};

ecan.mapviewer.updateBufferDialog = function () {
    var bufferValue = $('#bufferOptions').val();

    // Check for custom distance
    if (bufferValue == 'custom') {
        // Don't update the custom input box and show it in the screen
        $('#customBufferDistanceRow').show();
    }
    else {
        // Hide the custom disatnce row
        $('#customBufferDistanceRow').hide();

        // Set the value of the custom distance box
        $('#bufferDistance').val(bufferValue);
    }
};

ecan.mapviewer.showBufferDialog = function (bufferType) {
    if (ecan.mapviewer.geometryService == null) {
        ecan.mapviewer.geometryService = new esri.tasks.GeometryService(ecan.mapviewer.geometryURL);
    }

    // Set the buffer type flag
    ecan.mapviewer.currentBuffer = bufferType;

    // Show the buffer dialog
    $('#bufferDialog').dialog('open');
};

ecan.mapviewer.generateBuffer = function (bufferValue) {
    // Set the buffer distance value
    ecan.mapviewer.bufferdistance = bufferValue;

    // Get the shape
    var geometries = [];
    var ispolygon = false;

    if (ecan.mapviewer.currentBuffer == 'results') {
        $.each(ecan.mapviewer.resultsLayer.graphics, function () {
            // Check the geometry type is a polygon
            if (this.geometry.type == 'polygon') {
                ispolygon = true;
            }
            geometries.push(this.geometry);
        });
    }
    else {
        if (ecan.mapviewer.selectedGraphic != null) {
            // Check the geometry type is a polygon
            if (ecan.mapviewer.selectedGraphic.geometry.type == 'polygon') {
                ispolygon = true;
            }
            geometries.push(ecan.mapviewer.selectedGraphic.geometry);
        }
        else {
            alert('A graphic needs to be selected before you can buffer a feature');
            return;
        }
    }

    if (ispolygon) {
        // Call to generalise the geometry
        var gparams = new esri.tasks.GeneralizeParameters();
        gparams.geometries = geometries;
        gparams.maxDeviation = 5;

        // Execute the generalise
        ecan.mapviewer.geometryService.generalize(gparams, ecan.mapviewer.onGeneraliseComplete, ecan.mapviewer.onGeneraliseError);
    }
    else {
        var params = new esri.tasks.BufferParameters();
        params.outSpatialReference = ecan.mapviewer.map.spatialReference;
        params.geometries = geometries;
        params.unionResults = true;
        params.distances = [new Number(ecan.mapviewer.bufferdistance)];
        params.unit = esri.tasks.GeometryService.UNIT_METER;

        // Execute the buffer
        ecan.mapviewer.geometryService.buffer(params, ecan.mapviewer.onBufferComplete, ecan.mapviewer.onBufferError);
    }
};

ecan.mapviewer.onBufferComplete = function (geometries) {
    var geometry = geometries[0];
    if (geometry == null) {
        alert('There was a problem generating the buffer.  Please contact the system administrator if this problem persists');
    }
    else {
        // Check if context menus have been setup
        if (ecan.mapviewer.ctxMenuForMap == null) {
            ecan.mapviewer.createDrawingTools(false);
        }

        // Add a buffer graphic to the map;
        var symbol = new esri.symbol.SimpleFillSymbol();
        ecan.mapviewer.graphicsLayer.add(new esri.Graphic(geometry, symbol));
    }
};

ecan.mapviewer.onBufferError = function (error) {
    alert('There was a problem generating the buffer.  Please contact the system administrator if this problem persists');
};

ecan.mapviewer.onGeneraliseComplete = function (geometries) {
    var params = new esri.tasks.BufferParameters();
    params.outSpatialReference = ecan.mapviewer.map.spatialReference;
    params.geometries = geometries;
    params.unionResults = true;
    params.distances = [new Number(ecan.mapviewer.bufferdistance)];
    params.unit = esri.tasks.GeometryService.UNIT_METER;

    // Execute the buffer
    ecan.mapviewer.geometryService.buffer(params, ecan.mapviewer.onBufferComplete, ecan.mapviewer.onBufferError);
};

ecan.mapviewer.onGeneraliseError = function (error) {
    alert('There was a problem generating the buffer.  Please contact the system administrator if this problem persists');
};

/* DRAWING MEASUREMENT FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.showMeasurementsDialog = function () {
    // Check for a selected graphic
    if (ecan.mapviewer.selectedGraphic == null) {
        alert('There are no graphics selected at this time');
    }
    else {
        // Call for measurements to be calculated for the geometry of the shape
        ecan.mapviewer.measureShape(ecan.mapviewer.selectedGraphic.geometry);
    }
};

ecan.mapviewer.measureShape = function (geometry) {
    if (geometry != null) {
        // Check the geometry type
        switch (geometry.type) {
            case "point":
                alert(ecan.mapviewer.returnCentroidString(geometry));
                break;

            case "multipoint":
                alert(ecan.mapviewer.returnExtentString(geometry));
                break;

            case "polyline":
                ecan.mapviewer.requestLengthMeasurements(geometry);
                break;

            case "extent":
                alert(ecan.mapviewer.returnExtentString(geometry));
                break;

            case "polygon":
                ecan.mapviewer.requestAreaMeasurements(geometry);
                break;
        }
    }
};

ecan.mapviewer.returnExtentString = function (geometry) {
    var extstring = "";
    if (geometry.type != "point") {
        var ext = geometry.getExtent();
        var area = ext.getHeight() * ext.getWidth();
        extstring = "Extent Area: " + ecan.tools.addCommas(area.toFixed(0).toString()) + " m²" + "\n";
        extstring += "Minimum X: " + ecan.tools.addCommas(ext.xmin.toFixed(0).toString()) + " mE" + "\n";
        extstring += "Maximum X: " + ecan.tools.addCommas(ext.xmax.toFixed(0).toString()) + " mE" + "\n";
        extstring += "Minimum Y: " + ecan.tools.addCommas(ext.ymin.toFixed(0).toString()) + " mN" + "\n";
        extstring += "Maximum Y: " + ecan.tools.addCommas(ext.ymax.toFixed(0).toString()) + " mN";
    }

    return extstring;
};

ecan.mapviewer.returnCentroidString = function (geometry) {
    var extstring = "";
    var pt = null;
    if (geometry.type != "point") {
        pt = geometry.getExtent().getCenter();
    }
    else {
        pt = geometry;
    }
    extstring = "Centroid X: " + ecan.tools.addCommas(pt.x.toFixed(0).toString()) + " mE" + "\n";
    extstring += "Centroid Y: " + ecan.tools.addCommas(pt.y.toFixed(0).toString()) + " mN";

    return extstring;
};

ecan.mapviewer.requestAreaMeasurements = function (geometry) {
    if (ecan.mapviewer.geometryService == null) {
        ecan.mapviewer.geometryService = new esri.tasks.GeometryService(ecan.mapviewer.geometryURL);
    }

    var areasAndLengthParams = new esri.tasks.AreasAndLengthsParameters();
    areasAndLengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;
    areasAndLengthParams.areaUnit = esri.tasks.GeometryService.UNIT_SQUARE_METERS;

    ecan.mapviewer.geometryService.simplify([geometry], function (simplifiedGeometries) {
        areasAndLengthParams.polygons = simplifiedGeometries;
        ecan.mapviewer.geometryService.areasAndLengths(areasAndLengthParams,
        function (result) {
            var resstring = "Area: " + ecan.tools.addCommas(result.areas[0].toFixed(0).toString()) + " m²" + "\n";
            resstring += "Perimeter: " + ecan.tools.addCommas(result.lengths[0].toFixed(0).toString()) + " m" + "\n\n";
            resstring += ecan.mapviewer.returnExtentString(geometry) + "\n\n";
            resstring += ecan.mapviewer.returnCentroidString(geometry) + "\n\n";

            alert(resstring);
        },
        function (error) { alert('There was a problem calculating the measurements for this shape.'); }
        );
    });
};

ecan.mapviewer.requestLengthMeasurements = function (geometry) {
    if (ecan.mapviewer.geometryService == null) {
        ecan.mapviewer.geometryService = new esri.tasks.GeometryService(ecan.mapviewer.geometryURL);
    }

    var lengthParams = new esri.tasks.LengthsParameters();
    lengthParams.lengthUnit = esri.tasks.GeometryService.UNIT_METER;

    ecan.mapviewer.geometryService.simplify([geometry], function (simplifiedGeometries) {
        lengthParams.polylines = simplifiedGeometries;
        ecan.mapviewer.geometryService.lengths(lengthParams,
        function (result) {
            var resstring = "Length: " + ecan.tools.addCommas(result.lengths[0].toFixed(0).toString()) + " m" + "\n\n";
            resstring += ecan.mapviewer.returnExtentString(geometry) + "\n\n";
            resstring += ecan.mapviewer.returnCentroidString(geometry) + "\n\n";

            alert(resstring);
        },
        function (error) { alert('There was a problem calculating the measurements for this shape.'); }
        );
    });
};


/* SEARCH FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.setSampleButton = '<input id="sampleValueList" type="text" title="Enter value to search for in this field" style="width: 120px;" /><img src="Content/images/GenericSearch32.png" onclick="ecan.mapviewer.getSampleValues()" title="Get Sample Values" style="vertical-align: middle; padding-left: 5px; cursor: pointer;" />';

ecan.mapviewer.resetGetSampleButton = function () {
    $('#sampleValuesContainer').html(ecan.mapviewer.setSampleButton);
};

ecan.mapviewer.setActiveLayer = function (layerid, sublayerid) {
    var layer = ecan.mapviewer.mapLayers[layerid];
    var sublayer = $.grep(layer.sublayers, function (s) { return s.layerId == sublayerid })[0];

    var layerurl;
    switch (layer.layer.declaredClass) {
        case "esri.layers.FeatureLayer":
            // Feature Layer
            layerurl = layer.layer.url;
            break;

        default:
            layerurl = layer.layer.url + '/' + sublayerid;
            break;
    }

    if (ecan.mapviewer.activeLayer == null || (ecan.mapviewer.activeLayer.layerid !== layerid || ecan.mapviewer.activeLayer.sublayerid !== sublayerid)) {
        ecan.mapviewer.activeLayer = {};
        ecan.mapviewer.activeLayer["layerid"] = layerid;
        ecan.mapviewer.activeLayer["sublayerid"] = sublayerid;

        $('#queryLayerDetails').html('').addClass('loading');
        var queryLayer = new esri.layers.FeatureLayer(layerurl, { outFields: ["*"] });
        dojo.connect(queryLayer, "onLoad", function () {
            // Update the query details
            var html = '<span>Construct Query Expression</span><br/><table><tbody>';

            // Update the field list
            html += '<tr><td>Field: </td><td><select id="queryField" onchange="ecan.mapviewer.resetGetSampleButton()" >';

            var filterList = ["SHAPE", "SHAPE.STLENGTH()", "SHAPE.STAREA()", "OBJECTID"];

            // Iterate through the fields and build fieldlist for the query box
            $.each(ecan.mapviewer.activeLayer["querytask"].fields, function () {
                if (filterList.indexOf(this.name.toUpperCase()) == -1) {
                    html += '<option value="' + this.name + '">' + this.name + '</option>';
                }
            });

            html += '</select></td></tr>';

            // Add the operator list
            html += '<tr><td>Operator: </td><td><select id="operatorList">';

            html += '<option value=" = "> = </option>';
            html += '<option value=" &lt; "> &lt; </option>';
            html += '<option value=" &gt; "> &gt; </option>';
            html += '<option value=" &lt;= "> &lt;= </option>';
            html += '<option value=" &gt;= "> &gt;= </option>';
            html += '<option value=" LIKE "> LIKE </option>';
            html += '<option value=" IN (  ) "> IN </option>';

            html += '</select></td></tr>';

            // Add the sample value placeholder
            html += '<tr><td>Sample Values: </td><td id="sampleValuesContainer">' + ecan.mapviewer.setSampleButton + '</td></tr>';

            // Close the table
            html += '</tbody></table>';

            // Update the details html
            $('#queryLayerDetails').html(html).removeClass('loading');
        });
        ecan.mapviewer.activeLayer["querytask"] = queryLayer; //new esri.tasks.QueryTask(layerurl);
        ecan.mapviewer.activeLayer["layerName"] = sublayer.layerName;

        var query = new esri.tasks.Query();
        query.outFields = ["*"];
        query.returnGeometry = true;
        query.geometryPrecision = 1;
        query.outSpatialReference = ecan.mapviewer.map.spatialReference;
        ecan.mapviewer.activeLayer["query"] = query;

        // Update the active layer block
        $('#activeLayerLabel').html(sublayer.layerName);

        // Set the active value in the ID List
        $('#activeLayerListID').unbind('change.active');
        $('#activeLayerListID').val(layerid + '|' + sublayerid);
        $('#activeLayerListID').bind('change.active', function () {
            ecan.mapviewer.activeLayerListChangeID();
        });

        // Set the active value in the Query List
        $('#activeLayerListQuery').unbind('change.active');
        $('#activeLayerListQuery').val(layerid + '|' + sublayerid);
        $('#activeLayerListQuery').bind('change.active', function () {
            ecan.mapviewer.activeLayerListChangeQuery();
        });
    }
};

ecan.mapviewer.activeLayerListChangeID = function () {
    var parts = $('#activeLayerListID').val().split('|');
    var layerid = parts[0];
    var sublayerid = parts[1];
    ecan.mapviewer.setActiveLayer(layerid, sublayerid);

    // Update the selected value in the ID active layer list
    $('#activeLayerListQuery').val($('#activeLayerListID').val());

    // Update the legend selection

    // Clear selected object
    $('.layerItem,.sublayerItem').removeClass('active');

    // Set this and any subitems as active
    $('.layerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');
    $('.sublayerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');
};

ecan.mapviewer.activeLayerListChangeQuery = function () {
    if ($('#activeLayerListQuery').val() == null) {
        $("#activeLayerListQuery")[0].selectedIndex = 0;
    }

    var parts = $('#activeLayerListQuery').val().split('|');

    var layerid = parts[0];
    var sublayerid = parts[1];
    ecan.mapviewer.setActiveLayer(layerid, sublayerid);

    // Update the selected value in the ID active layer list
    $('#activeLayerListID').val($('#activeLayerListQuery').val());

    // Update the legend selection

    // Clear selected object
    $('.layerItem,.sublayerItem').removeClass('active');

    // Set this and any subitems as active
    $('.layerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');
    $('.sublayerItem[layerid="' + layerid + '"][sublayerid="' + sublayerid + '"]').addClass('active');
};

ecan.mapviewer.repopulateActiveLayerList = function () {
    var html = '<option value="" selected>Not Set</option>';
    var layerid, sublayerid, layername, layerurl;

    var activelayers = [];

    $.each(ecan.mapviewer.mapLayers, function (key, value) {
        layerid = key;
        layerurl = value.layer.url;

        switch (value.layer.declaredClass) {
            case "esri.layers.FeatureLayer":
                // Feature Layer
                sublayerid = value.layer.url.substring(value.layer.url.lastIndexOf("/") + 1);
                layername = value.layer.name;


                var opt = { "layerid": layerid, "sublayerid": sublayerid, "layername": layername, "layerurl": layerurl };

                // Check if there is an object with these properties in the activelayers arrayy
                var found = false;
                $.each(activelayers, function () {
                    if (this.layerurl == opt.layerurl) {
                        found = true;
                        return false;
                    }
                });

                if (!found) {
                    activelayers.push(opt);
                }

                break;

            default:
                $.each(value.sublayers, function () {
                    sublayerid = this.layerId;
                    layername = this.layerName;
                    var sublayerurl = layerurl + "/" + sublayerid;

                    var opt = { "layerid": layerid, "sublayerid": sublayerid, "layername": layername, "layerurl": sublayerurl };

                    // Check if there is an object with these properties in the activelayers arrayy
                    var found = false;
                    $.each(activelayers, function () {
                        if (this.layerurl == opt.layerurl) {
                            found = true;
                            return false;
                        }
                    });

                    if (!found) {
                        activelayers.push(opt);
                    }

                });
                break;
        }
    });

    // Create the options
    $.each(activelayers, function () {
        html += '<option value="' + this.layerid + '|' + this.sublayerid + '" >' + this.layername + '</option>';
    });

    $('.activeLayerList').html(html).each(function () { $(this).sort_select_box(); /*$(this).val('Not Set');*/ });

    //make sure the no set option is selected
    $('.activeLayerList').val('');
};

ecan.mapviewer.activateIDTool = function (tool) {
    // Clear the active tool
    ecan.mapviewer.clearActiveTool();

    // Clear the active tool
    $('.idtool').removeClass('active');

    // Set the tool
    switch (tool) {
        case "point":
            $('#idPoint').addClass('active');
            ecan.mapviewer.setToolLabel('Identify at Point Tool');
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POINT;
            break;

        case "line":
            $('#idLine').addClass('active');
            ecan.mapviewer.setToolLabel('Identify with Line Tool');
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POLYLINE;
            break;

        case "polygon":
            $('#idPolygon').addClass('active');
            ecan.mapviewer.setToolLabel('Identify with Polygon Tool');
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.POLYGON;
            break;

        case "rectangle":
            $('#idRectangle').addClass('active');
            ecan.mapviewer.setToolLabel('Identify with Rectangle Tool');
            ecan.mapviewer.currentDrawTool = esri.toolbars.Draw.EXTENT;
            break;
    }

    // Disable the popups
    //ecan.mapviewer.map.showInfoWindowOnClick = false;
    $.each(ecan.mapviewer.map.graphicsLayerIds, function () {
        var layerID = this;
        var layer = ecan.mapviewer.map.getLayer(layerID);

        if (layer != null) {
            if (layer.infoTemplate != null) {
                // Temporarily remove info template  
                layer.setInfoTemplate(null);
            }
        }
    });

    // Check the map scale
    ecan.mapviewer.drawToolbar.activate(ecan.mapviewer.currentDrawTool);
};

ecan.mapviewer.searchByGeometry = function (geometry) {
    // Check for a valid active layer
    if (ecan.mapviewer.activeLayer != null) {
        // Set the search geometry
        var searchGeometry = null;

        // Check for a point
        if (geometry.type == 'point') {
            // Get a buffer distance for the pixel size
            var offset = (ecan.mapviewer.map.extent.getWidth() / ecan.mapviewer.map.width) * ecan.mapviewer.pointTolerance;
            var x = geometry.x;
            var y = geometry.y;

            // Generate a search rectangle
            searchGeometry = new esri.geometry.Polygon(new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid }));
            searchGeometry.addRing([[x - offset, y - offset], [x - offset, y + offset], [x + offset, y + offset], [x + offset, y - offset], [x - offset, y - offset]]);
        }
        else {
            searchGeometry = geometry;
        }

        // Update the query parameter
        var query = ecan.mapviewer.activeLayer.query;
        query.geometry = searchGeometry;
        ecan.mapviewer.activeLayer.querytask.queryFeatures(query, ecan.mapviewer.showResults); //, ecan.mapviewer.queryError);

        // Show the working screen
        if ($('#idWorking').hasClass('hidden')) {
            $('#idWorking').removeClass('hidden');
        }
        $('#searchResultsGrid').html(ecan.mapviewer.resultsEmptyHtml).addClass('loading');
    }
    else {
        alert('No Active layer is set at this time.\n' +
                'Click a layer on the legend or use\n' +
                'the dropdown list in the identify or\n' +
                'search tools and try again');
    }
};

ecan.mapviewer.searchByText = function (searchstring) {
    // Check for a valid active layer
    if (ecan.mapviewer.activeLayer != null) {
        // Update the query parameter
        var query = ecan.mapviewer.activeLayer.query;
        query.where = searchstring;
        ecan.mapviewer.activeLayer.querytask.queryFeatures(query, ecan.mapviewer.showResults); //, ecan.mapviewer.queryError);

        // Show the working screen
        if ($('#queryWorking').hasClass('hidden')) {
            $('#queryWorking').removeClass('hidden');
        }
        $('#searchResultsGrid').html(ecan.mapviewer.resultsEmptyHtml).addClass('loading');
    }
    else {
        alert('No Active layer is set at this time.\n' +
                'Click a layer on the legend or use\n' +
                'the dropdown list in the identify or\n' +
                'search tools and try again');
    }
};

ecan.mapviewer.findfield = function (fields, fieldname) {
    return $.grep(fields, function (item) {
        return item.name == fieldname;
    });
};

ecan.mapviewer.showResults = function (featureSet) {

    if (debugMode) console.log('ShowResults');

    // Clear the displayed graphics
    ecan.mapviewer.resultsLayer.clear();

    // Position results layer at the top of the display
    ecan.mapviewer.map.reorderLayer(ecan.mapviewer.resultsLayer, 100);

    var html = '';

    if (featureSet.features.length > 0) {
        var displayfieldname;

        //remove class to state has results
        $("#searchResultsGrid").removeClass('noresults');

        // Build symbol based on the geometry type
        switch (featureSet.geometryType) {
            case "esriGeometryPoint":
            case "esriGeometryMultiPoint":
                ecan.mapviewer.selectedSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10,
                     new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([98, 194, 204]), 2), new dojo.Color([98, 194, 204, 0.5]));
                break;

            case "esriGeometryPolyline":
                ecan.mapviewer.selectedSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([98, 194, 204]), 3);
                break;

            case "esriGeometryExtent":
            case "esriGeometryPolygon":
                ecan.mapviewer.selectedSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                     new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([98, 194, 204]), 3), new dojo.Color([98, 194, 204, 0.5]));
                break;
        }

        // Set the display name
        displayfieldname = featureSet.displayFieldName;

        var ignore = ['SHAPE.STAREA()', 'SHAPE.STLENGTH()', 'OBJECTID'];
        var objectidfield;

        html = '<div class="resultTableContainer"><table class="resultsTable" ><thead><tr><th></th>';

        $.each(featureSet.fields, function (key, value) {
            if (ignore.indexOf(value.name.toUpperCase()) == -1) {
                html += '<th>' + value.alias.replace(/_/g, " ") + '</th>';
            }

            if (value.type === "esriFieldTypeOID") {
                objectidfield = value.name;
            }

        });
        html += '</tr><thead><tbody>';

        var _gid = 0;
        $.each(featureSet.features, function () {
            var graphic = this;

            // Set the GID on the graphic
            graphic.attributes["_gid"] = _gid;

            var objectid = graphic.attributes[objectidfield];

            // Prepare the results table
            html += '<tr class="resultRow" title="Click to highlight this feature\nDouble click to zoom to the record extent" gid="' + _gid + '" onclick="ecan.mapviewer.highlightResult(' + _gid + ')" ondblclick="ecan.mapviewer.zoomToResult(' + _gid + ')" ><td class="rowID rowHeader" >' + (_gid + 1).toString() + '</td>';
            $.each(featureSet.fields, function (key, value) {
                if (ignore.indexOf(value.name.toUpperCase()) == -1) {
                    var fieldvalue = graphic.attributes[value.name];

                    switch (value.type) {
                        case "esriFieldTypeDate":
                            var dt = new Date(fieldvalue);
                            fieldvalue = dt.toDateString();
                            break;

                        case "esriFieldTypeString":
                            if (fieldvalue != null) {
                                if (fieldvalue.isURL()) {
                                    // Build a link instead of the attribute value
                                    fieldvalue = '<a href="' + fieldvalue + '" target="_blank">More Info</a>';
                                }
                            }
                            else {
                                fieldvalue = '';
                            }
                            break;
                    }

                    html += '<td>' + fieldvalue + '</td>';
                }
            });
            html += '</tr>';

            // Prepare the graphic for the map
            graphic.setSymbol(ecan.mapviewer.selectedSymbol);
            ecan.mapviewer.resultsLayer.add(graphic);

            if (debugMode) console.log('add first graphic');

            //show first graphic
            if (_gid == 0) {
                //Focus the map on the selected feature
                var extent;

                //Check geometry type
                if (graphic.geometry.type === 'point') {
                    ecan.mapviewer.map.centerAndZoom(graphic.geometry, 10);
                }
                else {
                    extent = graphic.geometry.getExtent();//.expand(1.1);
                    ecan.mapviewer.map.setExtent(extent, true);
                }
            }

            // Iterate to te next graphic id
            _gid++;
        });

        html += '<tbody></table></div>';

        // Add the table to the result container
        $('#searchResultsGrid').html(html).removeClass('loading');

        // Add striping to the results
        $('.resultsTable tbody tr:even').addClass('altRow');
    }
    else {
        html = '<strong>No records were returned by this search.</strong>';
        $('#searchResultsGrid').html(html).removeClass('loading');
        //tag grid with no results
        $("#searchResultsGrid").addClass('noresults');
    }

    // Check for mobile devices but not tablets - toggle results if not a phone
    if (!isMobile.any() || isMobile.Tablet() == false)
        ecan.mapviewer.toggleResults('open');

    if ($('#idWorking').hasClass('hidden') === false) {
        $('#idWorking').addClass('hidden');
    }

    if ($('#queryWorking').hasClass('hidden') === false) {
        $('#queryWorking').addClass('hidden');
    }

    if (featureSet.features.length === 1000) {
        alert('While performing this search the maximum record count of 1000 records was reached.\n' +
                'Because of this you need to be aware that there may actually be more records than\n' +
                'those returned here that meet the criteria you have specified.');
    }
};

ecan.mapviewer.queryError = function (err) {
    alert("error");
};

ecan.mapviewer.highlightResult = function (gid) {
    // Check if control button is pressed
    if (ecan.mapviewer.ctrlPressed == false) {
        // Clear the hightlighted results
        $('.resultRow').removeClass('highlightRow');
    }

    // Highlight the active row
    $('.resultRow[gid=' + gid + ']').addClass('highlightRow');

    // Get the selected feature
    var graphic;
    $.each(ecan.mapviewer.resultsLayer.graphics, function () {
        if (this.attributes["_gid"] == gid) {
            graphic = this;
        }
        else {
            if (ecan.mapviewer.ctrlPressed == false) {
                this.setSymbol(ecan.mapviewer.selectedSymbol);
            }
        }
    });

    // Set the select symbol
    if (graphic != null) {
        // Build symbol based on the geometry type
        var symbol
        switch (graphic.geometry.type) {
            case "point":
            case "multipoint":
                symbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10,
                     new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([255, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.5]));
                break;

            case "polyline":
                symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([255, 0, 0]), 3);
                break;

            case "extent":
            case "polygon":
                symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
                     new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                     new dojo.Color([255, 0, 0]), 3), new dojo.Color([255, 0, 0, 0.5]));
                break;
        }
        graphic.setSymbol(symbol);

        // Move the graphic to the top of the stack
        ecan.mapviewer.resultsLayer.remove(graphic);
        ecan.mapviewer.resultsLayer.add(graphic);
    }
};

ecan.mapviewer.clearHighlightedResults = function () {
    // Clear the hightlighted results
    $('.resultRow').removeClass('highlightRow');

    // Clear the selected symbol from result graphics
    $.each(ecan.mapviewer.resultsLayer.graphics, function () {
        if (this.symbol != ecan.mapviewer.selectedSymbol) {
            this.setSymbol(ecan.mapviewer.selectedSymbol);
        }
    });
};

ecan.mapviewer.removeHighlighted = function () {
    // Get the selected features
    var graphic;
    var removes = [];

    // Get the graphics to remove
    $.each(ecan.mapviewer.resultsLayer.graphics, function () {
        graphic = this;

        // Check if this graphics is not using the selected symbol
        if (graphic.symbol != ecan.mapviewer.selectedSymbol) {
            removes.push(graphic);
        }
    });

    // Drop the records
    $.each(removes, function () {
        ecan.mapviewer.resultsLayer.remove(this);
    });

    // Clear the highligted record rows from the results grid
    $('.highlightRow').remove();

    // Update the row ids
    var rowID = 1;
    $('.resultsTable tbody tr td.rowID').each(function () {
        $(this).html(rowID.toString());
        rowID++;
    });

    // Reapply striping to the results
    $('.resultsTable tbody tr').removeClass('altRow');
    $('.resultsTable tbody tr:even').addClass('altRow');
};

ecan.mapviewer.zoomToResult = function (gid) {
    // Get the selected feature
    var graphic;
    $.each(ecan.mapviewer.resultsLayer.graphics, function () {
        if (this.attributes["_gid"] == gid) {
            graphic = this;
            return false;
        }
    });

    // Focus the map on the selected feature
    if (graphic != null) {
        var extent;

        // Check geometry type
        if (graphic.geometry.type == 'point') {
            ecan.mapviewer.map.centerAndZoom(graphic.geometry, 12);
        }
        else {
            extent = graphic.geometry.getExtent().expand(1.1);
            ecan.mapviewer.map.setExtent(extent, true);
        }
    }
};

ecan.mapviewer.clearSelection = function () {

    //tag grid with no results
    $("#searchResultsGrid").addClass('noresults');

    // Empty the result layer
    ecan.mapviewer.resultsLayer.clear();

    // Hide the popup window
    ecan.mapviewer.map.infoWindow.hide();

    // Reset the html
    $('#searchResultsGrid').html(ecan.mapviewer.resultsEmptyHtml);

    // Close the results grid
    ecan.mapviewer.toggleResults('close');
};

ecan.mapviewer.zoomSelection = function () {
    // Get the selected features
    var graphic;
    var extent;

    $.each(ecan.mapviewer.resultsLayer.graphics, function () {
        graphic = this;
        var gextent;
        // Check geometry type
        if (graphic.geometry.type == 'point') {
            var offset = 100;
            gextent = new esri.geometry.Extent(graphic.geometry.x - offset, graphic.geometry.y - offset, graphic.geometry.x + offset, graphic.geometry.y + offset, graphic.geometry.spatialReference)
        }
        else {
            gextent = graphic.geometry.getExtent();
        }

        if (extent != null) {
            extent = extent.union(gextent);
        }
        else {
            extent = gextent;
        }
    });

    if (extent != null) {
        ecan.mapviewer.map.setExtent(extent.expand(1.1), true);
    }
};

ecan.mapviewer.exportSelection = function () {
    //check that there are results.
    if (!$("#searchResultsGrid").hasClass('noresults')) {
        $("#searchResultsGrid").table2csv({
            callback: function (csv, name) {
                $.doPost(
                     "ReturnCSV.ashx",
                     { "FileName": "Results.csv", "data": csv });
            }
        });
    } else {
        alert("There are no results to export.");
    }
};

ecan.mapviewer.getSampleValues = function () {
    var fieldName, layer;
    fieldName = $('#queryField').val();
    layer = ecan.mapviewer.activeLayer["querytask"];

    // Query for the top 50 values
    var query = new esri.tasks.Query();
    query.outFields = [fieldName];
    query.returnGeometry = false;
    query.geometry = ecan.mapviewer.extentToPolygon(ecan.mapviewer.map.extent);

    // Use querytask because feature layer query will always bring back geometry
    var queryTask = new esri.tasks.QueryTask(layer.url);

    $('#sampleValuesContainer').addClass('loading');
    queryTask.execute(query, function (featureSet) {
        var samples = [];
        $.each(featureSet.features, function () {
            var sample = this.attributes[fieldName];
            if (sample != undefined && sample !== null && sample !== '' && samples.indexOf(sample) == -1) {
                samples.push(sample);
            }
        });

        // Check the field type for dates
        var field;
        $.each(layer.fields, function () {
            if (this.name == fieldName) {
                field = this;
                return false;
            }
        });

        var isDate = field.type == "esriFieldTypeDate";

        var html = '';
        if (samples.length > 0) {
            samples.sort();
            $.each(samples, function () {
                if (isDate) {
                    html += '<option value="' + new Date(this).toISOString() + '">' + new Date(this).toISOString() + '</option>';
                } else {
                    html += '<option value="' + this + '"  title="' + this + '" >' + this.truncate(25) + '</option>';
                }
            });
            html = '<select id="sampleValueList">' + html + '</select>';
        }
        else {
            html = '<span id="sampleValueList">Sample Values Not Available.</span>';;
        }
        $('#sampleValuesContainer').html(html).removeClass('loading');
    });
};

ecan.mapviewer.insertQueryString = function () {
    // Get the field
    var fieldName = $('#queryField').val();
    var layer = ecan.mapviewer.activeLayer['querytask'];
    var field;
    $.each(layer.fields, function () {
        if (this.name == fieldName) {
            field = this;
            return false;
        }
    });

    if (field != null) {
        var queryInsert = fieldName;

        // Get the value
        var value = $('#sampleValueList').val();

        // Check if the value is null
        if (value == null || value == undefined) {
            alert('There are no sample values to insert - a blank value that you will need to fill in will be inserted instead');
            value = '<insert value here>';
        }

        // Check field type to append correct formatting on the value
        switch (field.type) {
            case "esriFieldTypeSmallInteger":
            case "esriFieldTypeInteger":
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
            case "esriFieldTypeOID":
            case "esriFieldTypeGUID":
            case "esriFieldTypeGlobalID":
                // Do nothing - the value is already formatted correctly
                break;

            case "esriFieldTypeString":
            case "esriFieldTypeDate":
                value = "'" + value + "'";
                break;

            default:
                alert('The field you have selected is of a type that cannot be queried on at this stage - please choose another field');
                return;
                break;
        }

        // Get the operator
        var operator = $('#operatorList').val();

        // Construct the full string to insert
        queryInsert += operator + value;

        // Insert the constructed querystring at the last mouse cursor position in the text area
        $('#queryStringText').insertAtCaret(queryInsert).focus();
    }
    else {
        alert('There was a problem constructing the query string');
    }
};

ecan.mapviewer.insertValueString = function () {
    // Get the field
    var fieldName = $('#queryField').val();
    var layer = ecan.mapviewer.activeLayer['querytask'];
    var field;
    $.each(layer.fields, function () {
        if (this.name == fieldName) {
            field = this;
            return false;
        }
    });

    if (field != null) {

        // Get the value
        var value = $('#sampleValueList').val();

        // Check if the value is null
        if (value == null || value == undefined) {
            alert('There are no sample values to insert - a blank value that you will need to fill in will be inserted instead');
            value = '<insert value here>';
        }

        // Check field type to append correct formatting on the value
        switch (field.type) {
            case "esriFieldTypeSmallInteger":
            case "esriFieldTypeInteger":
            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
            case "esriFieldTypeOID":
            case "esriFieldTypeGUID":
            case "esriFieldTypeGlobalID":
                // Do nothing - the value is already formatted correctly
                break;

            case "esriFieldTypeString":
            case "esriFieldTypeDate":
                value = "'" + value + "'";
                break;

            default:
                alert('The field you have selected is of a type that cannot be queried on at this stage - please choose another field');
                return;
                break;
        }

        // Construct the full string to insert
        var queryInsert = value;

        // Insert the constructed querystring at the last mouse cursor position in the text area
        $('#queryStringText').insertAtCaret(queryInsert);
        if (isMobile.any() == null) {
            $('#queryStringText').focus();
        }
    }
    else {
        alert('There was a problem constructing the query string');
    }
};

ecan.mapviewer.queryTextAreaChange = function () {
    var len = $('#queryStringText').val().length;
    var disabled = false;
    if (len == 0) {
        disabled = true;
    }

    if (disabled) {
        $('#executeSearchButton').prop('disabled', 'disabled');
    }
    else {
        $('#executeSearchButton').prop('disabled', '');
    }
};

ecan.mapviewer.resetQueryString = function () {
    $('#queryStringText').val('');
    $('#executeSearchButton').prop('disabled', 'disabled');
};

ecan.mapviewer.queryFeatures = function () {
    ecan.mapviewer.searchByText($('#queryStringText').val());
};



/* CHECK FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.tools.isNumberKey = function (evt) {
    var charCode = (evt.which) ? evt.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
        return false;

    return true;
}


/* FORMAT FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.tools.addCommas = function (nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}

ecan.tools.urlParam = function (name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?#&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (debugMode) console.log('URL params: ', results);
    if (results == null)
        return "";
    else
        return results[1];
};

/* PRINT SETUP AND ACTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.removeDownloadBtn = function () {
    $('#printDialogResult').html('');
}

ecan.mapviewer.preparePrintDialog = function () {

    var layoutTemplate, templateNames, mapOnlyIndex, templates;

    ecan.mapviewer.printer = new esri.tasks.PrintTask(ecan.mapviewer.printServiceURL, { async: true });

    // get print templates from the export web map task
    var printInfo = esri.request({
        "url": ecan.mapviewer.printServiceURL,
        "content": { "f": "json" }
    });

    printInfo.then(handlePrintInfo, printError);

    function handlePrintInfo(resp) {

        // get print template details
        if (debugMode) console.log(resp);

        var layoutTemplate, templateNames, mapOnlyIndex, templates, OutputType;

        layoutTemplate = dojo.filter(resp.parameters, function (param, idx) {
            return param.name === "Layout_Template";
        });

        if (layoutTemplate.length == 0) {
            if (debugMode) console.log("print service parameters name for templates must be \"Layout_Template\"");
            return;
        }
        templateNames = layoutTemplate[0].choiceList;

        //// remove the MAP_ONLY template then add it to the end of the list of templates 
        mapOnlyIndex = dojo.indexOf(templateNames, "MAP_ONLY");
        if (mapOnlyIndex > -1) {
            var mapOnly = templateNames.splice(mapOnlyIndex, mapOnlyIndex + 1)[0];
            templateNames.push(mapOnly);
        }

        OutputType = dojo.filter(resp.parameters, function (param, idx) {
            return param.name === "Format";
        });

        OutputType = OutputType[0].choiceList;

        //Print output types
        if (debugMode) console.log(OutputType);

        //Update the templates and file types with the right values.
        $('#templateList').html(buildDropDownHTML(templateNames));
        $('#fileTypeList').html(buildDropDownHTML(OutputType));

    }

    function buildDropDownHTML(object) {
        var html = '';
        $.each(object, function (t) {
            html += '<option value="' + object[t] + '">' + object[t] + '</option>';
        })

        if (debugMode) console.log(html);
        return html;
    };

    //create url for download.
    function printResult(data) {
        // Add the result as a link for downloads
        $('#printDialogResult').html('<a href="' + data.url + '" target="_blank" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only ui-state-focus"><span class="ui-button-text">Download File</span></a>');

        // Show the loading state
        ecan.mapviewer.setPrintDialogState('normal');
    };

    function printError(error) {

        //add error if exists
        if (error == null) error = '';
        $('#printDialogResult').html('There was a problem creating the print file:' + error);

        // Show the loading state
        ecan.mapviewer.setPrintDialogState('normal');
    };

    // Setup the print dialog
    $('#printDialog').dialog({
        autoOpen: false,
        draggable: false,
        modal: true,
        resizable: false,
        title: "Create Print",
        width: 320,
        buttons: {
            "Create Print File": function () {
                // Show the loading state
                ecan.mapviewer.setPrintDialogState('working');

                // Clear an previous link to created maps
                $('#printDialogResult').html('');

                // Prepare the print settings
                var template = new esri.tasks.PrintTemplate();

                var filetype = $('#fileTypeList').val();
                var templateName = $('#templateList').val();
                var authorName = $('#mapAuthorInput').val();
                var titleText = $('#mapTitleInput').val();
                var quality = parseInt($('#qualityList').val());

                var mapwidth = ecan.mapviewer.map.width;
                var mapheight = ecan.mapviewer.map.height;

                var preserveExtent = $('#extentModeList').val() == "true";

                if (templateName == "MAP_ONLY") {
                    template.exportOptions.width = mapwidth;
                    template.exportOptions.height = mapheight;
                    template.exportOptions.dpi = quality;
                }
                else {
                    template.exportOptions.dpi = quality;
                }
                template.format = filetype;
                template.layout = templateName;
                template.preserveScale = preserveExtent;

                // Build legend items
                var legendItems = [];
                // ----- to do

                // Set the layout options
                template.layoutOptions = {
                    "authorText": authorName,
                    "titleText": titleText,
                    "scalebarUnit": "Kilometers"
                };

                var params = new esri.tasks.PrintParameters();
                params.template = template;
                params.map = ecan.mapviewer.map;

                /* PRINT SERVICE CALL FOR 10.1
                ------------------------------------------------------------------- */
                ecan.mapviewer.printer.execute(params, printResult, printError);
            },
            "Close": function () {
                $(this).dialog("close");
            }
        },
        open: function (event, ui) {
            // Remove the download button if already exists
            $('#printDialogResult').html('');

            // Hide the loading state
            ecan.mapviewer.setPrintDialogState('normal');
        }
    }).removeClass('hidden');

    $('#printDialogWorking').hide();

    $('.ui-dialog-content').css('padding', '2px');
};

ecan.mapviewer.handlePrintResult = function (result) {
    // Remove the working message
    ecan.mapviewer.setPrintDialogState('normal');

    // Open the map
    window.open(result.url);
};

ecan.mapviewer.handlePrintResultError = function (err) {
    alert(err.toString());
};

ecan.mapviewer.setPrintDialogState = function (state) {
    if (state == 'working') {
        // Disable the button
        $(":button:contains('Print')").attr("disabled", "disabled").addClass('ui-state-disabled');

        // Show the working screen
        $('#printDialogContent').hide();
        $('#printDialogWorking').show();
    }
    else {
        // Re-enable the Print button
        $(":button:contains('Print')").attr("disabled", null).removeClass('ui-state-disabled').removeClass('ui-state-focused');

        // Show the working screen
        $('#printDialogContent').show();
        $('#printDialogWorking').hide();
    }
};


/* QUICK SEARCH FUNCTIONS
-----------------------------------------------------------------------------------------------*/
ecan.mapviewer.prepareQuickSearch = function () {
    $("#searchText").autocomplete({
        source: function (request, response) {
            ecan.mapviewer.quickSearchSelected = null;
            $.ajax({
                url: ecan.mapviewer.quickSearchURL,
                dataType: "jsonp",
                type: "GET",
                crossDomain: true,
                data: {
                    f: "pjson",
                    searchclass: ecan.mapviewer.quickSearchFilter,
                    searchlimit: 20,
                    searchterm: request.term
                },
                success: function (data, status, xhr) {
                    if (debugMode) console.log('success search', data);
                    response($.map(data.searchResults, function (item) {
                        return {
                            label: item.label + ' [' + item.value.keydescription + ']',
                            value: item.label + ' [' + item.value.keydescription + ']',
                            data: item
                        }
                    }));

                },
                error: function (error) {
                    alert('There was a problem processing your search');
                    if (debugMode) {
                        console.log('error code', error);

                    }
                    return false;
                },
                statusCode: {
                    404: function () {
                        alert('There was a problem processing your search');
                        if (debugMode) {
                            console.log('error code 404', error);

                        }
                        return false;
                    },
                    500: function () {
                        alert('There was a problem processing your search');
                        if (debugMode) {
                            console.log('error code 500', error);

                        }
                        return false;
                    }
                }
            });
        },
        minLength: 4,
        select: function (event, ui) {
            // Set the current item
            ecan.mapviewer.quickSearchSelected = ui.item.data;
            if (debugMode) console.log('address selected', ecan.mapviewer.quickSearchSelected);

            if (ui.item.label != ' [No Matching Results]') {
                // Execute the search
                ecan.mapviewer.executeQuickSearch();
            }
        }
    });

    //add clear button
    if (!isIE.IE10()) {
        $('input.autoCompleteInput').wrap('<span class="clearQuickSearch" title="Click to reset" />').after($('<span/>').click(function () {
            $(this).prev('input').val('').focus();
        }));
    }
};

ecan.mapviewer.executeQuickSearch = function () {
    // Check for a search item
    if (ecan.mapviewer.quickSearchSelected != null) {
        // Check for a configured search settings item
        var searchsettings = ecan.mapviewer.quickSearch[ecan.mapviewer.quickSearchSelected.value.searchclass];

        if (searchsettings != null) {
            // Prepare a querytask based on these settings
            var queryTask = new esri.tasks.QueryTask(searchsettings.url);

            // Prepare the search sql 
            var searchstring = searchsettings.expression.replace("[value]", ecan.mapviewer.quickSearchSelected.value.searchkey);

            // Prepare the query param
            var query = new esri.tasks.Query();
            query.where = searchstring;
            query.returnGeometry = true;
            query.outSpatialReference = ecan.mapviewer.map.spatialReference;

            if (searchsettings.fields == '*' || searchsettings.fields == null) {
                query.outFields = ["*"];
            }
            else {
                query.outFields = searchsettings.fields.split(",");
            }

            // Execute the search
            queryTask.execute(query, ecan.mapviewer.showResults);

        }
        else {
            // Add a graphic to the map and zoom to the location

            // Create a point
            var loc = new esri.geometry.Point(ecan.mapviewer.quickSearchSelected.value.x, ecan.mapviewer.quickSearchSelected.value.y, new esri.SpatialReference({ wkid: ecan.mapviewer.quickSearchSelected.value.outSR }));

            // Create a graphic to display the point
            var location = new esri.Graphic(loc, new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10,
                           new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                           new dojo.Color([255, 0, 0]), 1), new dojo.Color([0, 255, 0, 0.25])));

            // Create the label graphic to label the location
            var label = new esri.Graphic(loc, new esri.symbol.TextSymbol(ecan.mapviewer.quickSearchSelected.label)
                        .setColor(new dojo.Color([0, 0, 0]))
                        .setFont(new esri.symbol.Font("12pt")
                        .setWeight(esri.symbol.Font.WEIGHT_BOLD)));

            // Add graphics to the drawiing graphics layer
            ecan.mapviewer.graphicsLayer.add(location);
            ecan.mapviewer.graphicsLayer.add(label);

            // Zoom the map to the point location
            ecan.mapviewer.map.centerAndZoom(loc, 16);
        }
    }
};


/* SHARE FUNCTIONS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.prepareShareTools = function () {
    $('#shareContainer input:radio').change(function () {
        var shareMethod = $(this).val();

        $('.shareButton').removeClass('disabled').addClass('disabled');
        switch (shareMethod) {
            case "facebook":
                $('.shareFacebook').removeClass('disabled');

                break;

            case "twitter":
                $('.shareTwitter').removeClass('disabled');

                break;

            case "embed":
                $('.shareMap').removeClass('disabled');

                break;
        }
    });

    // Add the button click event
    $('#executeShareButton').on('click.ViewerShare', function () {
        var shareMethod = $('input[name=shareMethod]:checked').val();

        switch (shareMethod) {
            case "facebook":
                ecan.mapviewer.shareFacebook();
                break;

            case "twitter":
                ecan.mapviewer.shareTwitter();
                break;

            case "embed":
                ecan.mapviewer.shareMap();
                break;
        }
    });
};

ecan.mapviewer.shareTwitter = function () {
    var url = window.location.href;

    // Strip all the current parameters
    url = url.substring(0, url.indexOf('#'));

    // Append the webmap id
    url += '#webmap=' + ecan.mapviewer.currentWebmap;

    url = url.replace('localhost:32064/', 'canterburymaps.govt.nz/viewer/');

    // Append the existing extent in the url
    url += '#extent=' + ecan.mapviewer.getExtentString();

    // Encode the url
    url = escape(url);

    // Open the twitter window
    window.open('https://twitter.com/intent/tweet?url=' + url,'_blank');
};

ecan.mapviewer.shareFacebook = function () {
    alert("Share facebook");
};

ecan.mapviewer.shareMap = function () {
    window.open('http://canterburymaps.govt.nz/Tools/SimpleMap.aspx?webmapid=' + ecan.mapviewer.currentWebmap + ecan.mapviewer.getEmbedExtent() + '#CodeConfigurator','blank');
};

ecan.mapviewer.getExtentString = function () {
    var ext = '';
    if (typeof ecan.mapviewer.map != 'underfined') {
        // get the map extent
        var xmin = parseInt(ecan.mapviewer.map.extent.xmin);
        var xmax = parseInt(ecan.mapviewer.map.extent.xmax);
        var ymin = parseInt(ecan.mapviewer.map.extent.ymin);
        var ymax = parseInt(ecan.mapviewer.map.extent.ymax);
        ext = xmin + ',' + ymin + ',' + xmax + ',' + ymax;
    }
    return ext;
};

ecan.mapviewer.getEmbedExtent = function () {
    var ext = '';
    if (typeof ecan.mapviewer.map != 'underfined') {
        // get the map extent
        var xmin = parseInt(ecan.mapviewer.map.extent.xmin);
        var xmax = parseInt(ecan.mapviewer.map.extent.xmax);
        var ymin = parseInt(ecan.mapviewer.map.extent.ymin);
        var ymax = parseInt(ecan.mapviewer.map.extent.ymax);
        ext = '&xmin=' + xmin + '&ymin=' + ymin + '&xmax' + xmax + '&ymax=' + ymax;
    }
    return ext;
};


/* Nav TAB METHODS
-----------------------------------------------------------------------------------------------*/

ecan.mapviewer.showTitleTab = function (name) {
    //select tab
    $("#sidebarTabs").tabs("option", "active", name);
    //open nav
    $('#sidebar').show("slide");
};


/* CONTROL BUTTON PRESS STATE
-----------------------------------------------------------------------------------------------*/

$(window).keydown(function (evt) {
    if (evt.which == 17) { // ctrl
        ecan.mapviewer.ctrlPressed = true;
    }
}).keyup(function (evt) {
    if (evt.which == 17) { // ctrl
        ecan.mapviewer.ctrlPressed = false;
    }
});


/* DELAY FUNCTION
-----------------------------------------------------------------------------------------------*/

ecan.timer = null;
ecan.delay = (function () {
    ecan.timer = 0;
    return function (callback, ms) {
        clearTimeout(ecan.timer);
        ecan.timer = setTimeout(callback, ms);
    };
})();


/* CUSTOM JAVASCRIPT FUNCTIONS AND JQUERY EXTENSIONS
-----------------------------------------------------------------------------------------------*/

// Cookies
ecan.mapviewer.getCookie = function (c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
};

ecan.mapviewer.setCookie = function (c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
};


// Adds a doPost method that does not require the page contain a form
//src: http://stackoverflow.com/questions/1149454/non-ajax-get-post-using-jquery-plugin

(function ($) {
    $.extend({
        getGo: function (url, params) {
            document.location = url + '?' + $.param(params);
        },
        doPost: function (url, params) {
            var $form = $("<form>")
                .attr("method", "post")
                .attr("action", url);
            $.each(params, function (name, value) {
                $("<input type='hidden'>")
                    .attr("name", name)
                    .attr("value", value)
                    .appendTo($form);
            });
            $form.appendTo("body");
            $form.submit();
        }
    });

})(jQuery);

// JQuery function to extend textinput to add text at the last position
$.fn.insertAtCaret = function (tagName) {
    return this.each(function () {
        if (document.selection) {
            //IE support
            this.focus();
            sel = document.selection.createRange();
            sel.text = tagName;
            this.focus();
        } else if (this.selectionStart || this.selectionStart == '0') {
            //MOZILLA/NETSCAPE support
            startPos = this.selectionStart;
            endPos = this.selectionEnd;
            scrollTop = this.scrollTop;
            this.value = this.value.substring(0, startPos) + tagName + this.value.substring(endPos, this.value.length);
            this.focus();
            this.selectionStart = startPos + tagName.length;
            this.selectionEnd = startPos + tagName.length;
            this.scrollTop = scrollTop;
        } else {
            this.value += tagName;
            this.focus();
        }
    });
};

// JQuery function to extend textinput to add text to either side of the last position
$.fn.insertRoundCaret = function (tagName) {
    return this.each(function () {
        strStart = '[' + tagName + ']';
        strEnd = '[/' + tagName + ']';
        if (document.selection) {
            //IE support
            stringBefore = this.value;
            this.focus();
            sel = document.selection.createRange();
            insertstring = sel.text;
            fullinsertstring = strStart + sel.text + strEnd;
            sel.text = fullinsertstring;
            document.selection.empty();
            this.focus();
            stringAfter = this.value;
            i = stringAfter.lastIndexOf(fullinsertstring);
            range = this.createTextRange();
            numlines = stringBefore.substring(0, i).split("\n").length;
            i = i + 3 - numlines + tagName.length;
            j = insertstring.length;
            range.move("character", i);
            range.moveEnd("character", j);
            range.select();
        } else if (this.selectionStart || this.selectionStart == '0') {
            //MOZILLA/NETSCAPE support
            startPos = this.selectionStart;
            endPos = this.selectionEnd;
            scrollTop = this.scrollTop;
            this.value = this.value.substring(0, startPos) + strStart + this.value.substring(startPos, endPos) + strEnd + this.value.substring(endPos, this.value.length);
            this.focus();
            this.selectionStart = startPos + strStart.length;
            this.selectionEnd = endPos + strStart.length;
            this.scrollTop = scrollTop;
        } else {
            this.value += strStart + strEnd;
            this.focus();
        }
    });
};

// JQuery function to extend selectbox to sort the options
$.fn.sort_select_box = function () {
    // Get options from select box 
    var my_options = $("#" + this.attr('id') + ' option');
    // sort alphabetically 
    my_options.sort(function (a, b) {
        if (a.text > b.text) return 1;
        else if (a.text < b.text) return -1;
        else return 0
    })
    //replace with sorted my_options; 
    $(this).empty().append(my_options);

};

/* Prototype modification to handle IE versions missing indexOf functions
------------------------------------------------------------------------- */
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        if (len === 0) {
            return -1;
        }

        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) {
                // shortcut for verifying if it's NaN                 
                n = 0;
            }
            else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }

        if (n >= len) {
            return -1;
        }

        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}

/* Prototype modification to string to add a clase for looking for text at the start of the string 
------------------------------------------------------------------------- */
String.prototype.isURL = function () {
    if (this == null)
        return false;
    else
        return (this.match(/^http/i) != null);
};

String.prototype.truncate = function (length, ellipsis) {
    var defaultLength = 100;
    if (!length) {
        var length = defaultLength;
    }
    if (!ellipsis) {
        var ellipsis = '&hellip;';
    }
    if (this.length < length) {
        return this;
    }
    else {
        for (var i = length - 1; this.charAt(i) != ' ' && i >= 0; i--) {
            length--;
        }
        if (length <= 0) {
            length = defaultLength;
        }
        return this.substr(0, length) + ellipsis;
    }
};


//FINISH LOADING MAP STUFF
ecan.mapviewer.FinishLoadingViewer = function () {

    if (debugMode) console.log("FinishLoadingMap");

    /* Starts tabs */
    $("#sidebarTabs").tabs({ heightStyle: "fill" });


    /*  Get HTML for empty search results so it can be later injected. */
    $.get('results.htm', function (data) {
        ecan.mapviewer.resultsEmptyHtml = data;
    });

    /*  Get HTML for about html . */
    $.get('About.htm', function (data) {
        $("#aboutdiv").html(data);
        $("#sidebarTabs").tabs({ heightStyle: "fill" });
    });

    /* Add a resize on the about button click to make sure the content is properly displayed */
    $('#aboutLink').click(function (event) {
        $("#aboutContainer").resize();
    });

    /*  Prepare the help. */
    var topics = ecan.mapviewer.getHelpTopics();
    $(topics).each(function () {
        // Append help option
        $('#helpTopic').append('<option value="' + $(this).attr("filename") + '" >' + $(this).attr("topicname") + '</option>');

        // Populate the intro topics
    });

    // Add the change handler
    $('#helpTopic').change(function () {
        // Get the new topic
        var topic = $(this).val();

        // Load the topic file into help window
        $.get(topic, function (data) {
            $("#helpdiv").html(data);
            $("#sidebarTabs").tabs({ heightStyle: "fill" });
        });
    });


    /*  Get intro HTML topic for help html. */
    $.get('Help.htm', function (data) {
        $("#helpdiv").html(data);
        $("#sidebarTabs").tabs({ heightStyle: "fill" });
    });

    // check if windows changes
    $(window).resize(function () {
        // refresh tabs for height
        $("#sidebarTabs").tabs({ heightStyle: "fill" });
    });

    // Hide the navigation bar if displayed on an ios device
    if (isMobile.iOS()) {
        setTimeout(function () { window.scrollTo(0, 1); }, 1000);
    }
};


//DELAY THE SETTING OF THE TOOL TIP for the layout to be ready
ecan.mapviewer.DelayedToolTips = function (selector, destroy) {

    setTimeout(function (destroy) {
        if (debugMode) console.log('first', destroy);


        var navTooltip = selector.tooltip({
            position: {
                my: "left bottom-20",
                at: "left top",
                using: function (position, feedback) {
                    $(this).css(position);
                    $("<div>")
                      .addClass("arrow")
                      .addClass(feedback.vertical)
                      .addClass(feedback.horizontal)
                      .appendTo(this);
                }
            }
        });
        navTooltip.tooltip("open");

        /// Close the tool tip after a while
        setTimeout(function () {
            navTooltip.tooltip("close");
            //console.log('destroy', destroy);
            navTooltip.tooltip("destroy");
        }, 5000);

    }, 2000);
}

ecan.mapviewer.getHelpTopics = function () {
    var topics = [];
    var mode = 'desktop';

    if (isMobile.Tablet() != null) {
        mode = "tablet";
    }
    else if (isMobile.any() != null) {
        mode = "phone";
    }

    $(ecan.mapviewer.helptopics).each(function () {
        var viewmode = this.viewermode;

        if (viewmode == "all" || viewmode.indexOf(mode) != -1) {
            topics.push(this);
        }
    });
    return topics;
};

ecan.mapviewer.checkTermsAndConditions = function () {
    // Check for existing cookie for site  
    var checked = ecan.mapviewer.getCookie('mapviewertermsandconditions');

    // Check the cookie value to make sure it matches the current flag value 
    if (checked == null || checked != ecan.mapviewer.termsdateflag) {
        // Prepare and show the splash dialog
        ecan.mapviewer.prepareSplashDialog();
    }
    else {
        ecan.mapviewer.prepareQuickMapsDialog();
    }
};


ecan.mapviewer.mapclickfunction = null;

ecan.mapviewer.disablePopups = function () {
    // Disconnect the map popup handler
    if (ecan.mapviewer.mapclickfunction != null) {
        ecan.mapviewer.mapclickfunction = ecan.mapviewer.map.onClick;
    }
    ecan.mapviewer.map.onClick = null;
};

ecan.mapviewer.enablePopups = function () {
    // Reconnect the map popup handler
    ecan.mapviewer.map.onClick = ecan.mapviewer.mapclickfunction;
    dojo.connect(ecan.mapviewer.map, "onClick", ecan.mapviewer.deferred.results[0].clickEventListener);
};



/* DOCUMENT READY
-----------------------------------------------------------------------------------------------*/
$(document).ready(function () {

    // Initialise the if webmapid present
    ecan.mapviewer.currentWebmap = ecan.tools.urlParam('webmap');

    dojo.addOnLoad(ecan.mapviewer.checkTermsAndConditions);

    // Prepare the quicksearch option
    ecan.mapviewer.prepareQuickSearch();

    //finish off viewer
    ecan.mapviewer.FinishLoadingViewer();

    if (ecan.mapviewer.isNative) {
        setTimeout(function () {
            $(document).on('click', "a", function (event) {
                           if (debugMode) console.log('onclick event');
                           //check is hyperlink
                           if (debugMode) console.log($(this).attr('href'));
                           if ($(this).attr('href') != undefined) {
                           //check for hash - so internal javascript
                           if(($(this).attr('href')).substring(0,1) =='#') { return;}
                           event.preventDefault();
                           var url = $(this).attr('href');
                           var target = $(this).attr('target');
                           if (debugMode) console.log('about to load url');
                           loadURL(url, target);
                           }
            });
        }, 5000);
    };

});


/*  NATIVE METHODS */
// Wait for Cordova to load
//
if (ecan.mapviewer.isNative) {
    document.addEventListener("deviceready", onDeviceReady, false);
}

// Cordova is loaded and it is now safe to make calls Cordova methods //
function onDeviceReady() {
if (debugMode) console.log('loading phonegap');
                          document.addEventListener("offline", checkConnection, false);
                          checkConnection();
}

function loadURL(url, target) {
    if (debugMode) console.log('loading url:', url, ' based on:', target);
    if (target == null) target = '_self';
    if (target == '_blank') target = '_blank';
    var ref = window.open(url, target, 'location=yes,enableViewportScale=yes,presentationstyle=fullscreen');
}

function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN] = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI] = 'WiFi connection';
    states[Connection.CELL_2G] = 'Cell 2G connection';
    states[Connection.CELL_3G] = 'Cell 3G connection';
    states[Connection.CELL_4G] = 'Cell 4G connection';
    states[Connection.CELL] = 'Cell generic connection';
    states[Connection.NONE] = 'No network connection';

    //alert to say no network connection so needed
    //alert(networkState);
    if (networkState == 'none') {
        ///alert('You need an internet connection for this application.');
        window.open('start.htm' + window.location.hash, '_self');
    }
}

/* Non Supported Browser 
-----------------------------------------------------------------------------------------------*/
/*      ALERTS FOR IE VERSIONS NOT SUPPORTED */

ecan.mapviewer.notSupporteddismiss = function () {
    $('#browserSupport').hide();
    $.cookie('cmaps_viewer_hide_agents', 'hidden', { expires: 7 });
    ecan.mapviewer.resize();
}

ecan.mapviewer.resize = function () {
    setTimeout(function () {
        // Call for the dojo components to be resized
        var mc = dijit.byId('mainContainer');
        mc.resize();

        // Reset the map size
        ecan.mapviewer.map.resize();
        ecan.mapviewer.map.reposition();
    }
    , 800);
}

ecan.mapviewer.notSupported = function () {

    if ((isIE.IEless9() != null) && $.cookie('cmaps_viewer_hide_agents') == null) {
        $('#browserSupport').html('<p>You are using a browser which this viewer does not support. Some features may not work correctly. Upgrade to a <a href="http://www.whatbrowser.org/" target="_blank">modern browser</a> to take full advantage of this site. <a href="#" onclick="ecan.mapviewer.notSupporteddismiss()">Dismiss</a></p>');
        $('#browserSupport').addClass('browserSupport');
        ecan.mapviewer.resize();
    }

};

