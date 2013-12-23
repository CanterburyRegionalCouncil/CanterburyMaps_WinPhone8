/// <reference path="~/Scripts/jsapi_vsdoc12_v33.js" />

/**
* Map Gallery ArcGIS
* Map coordinates function scripts
*
* This file contains the objects and functions utilised to navigate around teh map and
* return map coordinates.
*
* Created 2013 Ryan Elley
*
* Requirements
* jQuery version 1.6.2 or higher.
* A reference to ecan.namespaces.js is required prior to using this script.
* A  reference to the map object under the pathy ecan.mapviewer.map

Copyright License  - Canterbury Regional Council and Partners
Attribution-NonCommercial-ShareAlike 3.0 New Zealand (CC BY-NC-SA 3.0 NZ)
http://creativecommons.org/licenses/by-nc-sa/3.0/nz/

*
* Changes
*
* Change by     | Date          | Change
* Ryan Elley    | 26/02/2012    | Initial Creation
*/

/* NAMESPACES
-----------------------------------------------------------------------------------------------*/
ecan.coordinates = {};  // Namespace for the coordinates related actions

ecan.coordinates.prepareLocateUI = function (containerID) {
    // Add the ui elements
    $('#' + containerID).append('<div class="inputCont"><label for="inputX">X Coordinate</label><input id="inputX" type="number" name="inputX" class="cinput" title="Enter X Coordinate (7 Digits)" /></div>');
    $('#' + containerID).append('<div class="inputCont"><label for="inputY">Y Coordinate</label><input id="inputY" type="number" name="inputY" class="cinput" title="Enter Y Coordinate (7 Digits)" /></div>');
    $('#' + containerID).append('<div class="inputCont hint">e.g. X: 1570300, X: 5180600</div>');

    /* // RE - Commented out due to issue with the ceneterAndZoom action doing strange stuff
    $('#' + containerID).append('<label for="selectZoom">Scale</label><select id="selectZoom" name="select" class=""><br>');
    */

    $('#' + containerID).append('<div id="cbContainer"><div>');

    $('#cbContainer').append('<div id="locateButton" title="Locate Coordinates" class="toolbutton locate disabled"><div>');
    $('#cbContainer').append('<div id="clearButton" title="Clear" class="toolbutton clearSelection"><div>');

    /* // RE - Commented out due to issue with the ceneterAndZoom action doing strange stuff
    // Populate the select zoom level list
    if (ecan.mapviewer.map && ecan.mapviewer.map.loaded) {
        ecan.coordinates.prepareZoomScales(ecan.mapviewer.map);
    }
    else {
        dojo.connect(ecan.mapviewer.map, "onLoad", ecan.coordinates.prepareZoomScales);
    }
    */

    // Hook up the ui element event handlers
    $('.cinput')
        .keyup(function (event) {
            ecan.coordinates.validateInput();
        })
        .mouseup(function (event) {
            ecan.coordinates.validateInput();
        });

    $('#locateButton')
        .click(function (event) {
            if (!$("#locateButton").hasClass("disabled")) {
                ecan.coordinates.zoomToPoint();
            }
        });

    $('#clearButton')
    .click(function (event) {
        if (!$("#clearButton").hasClass("disabled")) {
            ecan.coordinates.clearCoordinates(true);
        }
    });

    // Apply number input filter
    $('.cinput').keydown(function (event) {
        ecan.coordinates.numericcheck(event);
    });

    // Create the location marketr symbol
    ecan.coordinates.ptsymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 12,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([0, 48, 103]), 2),
        new dojo.Color([154, 205, 50, 1]));

    ecan.coordinates.infoTemplate = new esri.InfoTemplate();
    ecan.coordinates.infoTemplate.setTitle("Coordinates");
    ecan.coordinates.infoTemplate.setContent("<strong>X: </strong>${X}  "
        + "<strong>Y: </strong>${Y}<br/>");

    // Show the container if hidden
    $('#' + containerID).show();
};

ecan.coordinates.validateInput = function () {
    var inX = $('#inputX').val();
    var inY = $('#inputY').val();

    var valid = (inX && inX.length > 0) && (inY && inY.length > 0);

    if (valid) {
        $("#locateButton").removeClass("disabled");
    }
    else {
        if (!$("#locateButton").hasClass("disabled")) {
            $("#locateButton").addClass("disabled");
        }
    }
};

ecan.coordinates.zoomToPoint = function () {
    // Reset the graphics/open info window
    ecan.coordinates.clearCoordinates();

    // Get the in x and y coordinate values
    var inX = $('#inputX').val();
    var inY = $('#inputY').val();

    // Create the point
    var pt = new esri.geometry.Point(inX, inY, new esri.SpatialReference(ecan.mapviewer.map.spatialReference.wkid));

    // Create a graphic to display on the map
    var atts = {};
    atts.X = inX;
    atts.Y = inY;
    var gra = new esri.Graphic(pt, ecan.coordinates.ptsymbol, atts, ecan.coordinates.infoTemplate);
    ecan.mapviewer.map.graphics.add(gra);

    // Show the popup
    var spt = ecan.mapviewer.map.toScreen(pt);
    ecan.mapviewer.map.infoWindow.setFeatures([gra]);
    ecan.mapviewer.map.infoWindow.show(spt, ecan.mapviewer.map.getInfoWindowAnchor(spt));

    /* // RE - Commented out due to issue with the ceneterAndZoom action doing strange stuff
    // Get the scale to go to
    var scale = $('#selectZoom').val();
    if (scale == 'current') {
        ecan.mapviewer.map.centerAt(pt);
    }
    else {
        var scl = parseInt(scale);
        ecan.mapviewer.map.centerAndZoom(pt, scl);
    }
    */
    ecan.mapviewer.map.centerAt(pt);

    // Toggle the sidebar
    ecan.mapviewer.toggleSideBar();
};

ecan.coordinates.clearCoordinates = function (clearvalues) {
    // Clear the graphic
    ecan.mapviewer.map.graphics.clear();

    // Clear the input contents
    if (clearvalues == true) {
        $('.cinput').val('');
    }

    // Hide the info window
    ecan.mapviewer.map.infoWindow.hide();
};

/* // RE - Commented out due to issue with the ceneterAndZoom action doing strange stuff
ecan.coordinates.prepareZoomScales = function (map) {
    $('#selectZoom').append('<option value="current">Current Scale</option>');

    var mapLevel = ecan.mapviewer.map.getLevel();
    var mapLODS = [];
    $.each(ecan.mapviewer.map.__tileInfo.lods, function (index, LOD) {
        if (!ecan.coordinates.hasLOD(mapLODS, LOD.Level)) {
            var level = { "level": LOD.level, "resolution": LOD.resolution, "scale": LOD.scale }
            //var level = { "level": LOD.level, "resolution": LOD.resolution, "scale": LOD.level }
        }
        mapLODS.push(level);
    });

    // Sort the lods
    mapLODS.sort(compare);

    $.each(mapLODS, function () {
        $('#selectZoom').append('<option value="' + this.level + '">1:' + this.scale + '</option>');
    });
};

ecan.coordinates.hasLOD = function (lods, level) {
    var found = false;
    var i, il = lods.length;
    for (i = 0; i < il; i++) {
        if (lods[i].level == level) {
            found = true;
            break;
        }
    }
    return found;
};

function compare(a, b) {
    if (a.level < b.level)
        return -1;
    if (a.level > b.level)
        return 1;
    return 0;
}
*/

ecan.coordinates.numericcheck = function (event) {
    // Allow: backspace, delete, tab and escape        
    if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 ||
        // Allow: Ctrl+A            
        (event.keyCode == 65 && event.ctrlKey === true) ||
        // Allow: home, end, left, right            
        (event.keyCode >= 35 && event.keyCode <= 39)) {
        // let it happen, don't do anything                 
        return;
    }
    else if (event.keyCode == 110) {
        // Check if there is already a decimal point in the text
        var text = event.target.value;

        if (text.indexOf(".") <= 1) {
            return;
        }
        else {
            event.preventDefault();
        }
    }
    else {
        // Ensure that it is a number and stop the keypress            
        if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
            event.preventDefault();
        }
    }
};