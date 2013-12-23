/*
Copyright License  - Canterbury Regional Council and Partners
Attribution-NonCommercial-ShareAlike 3.0 New Zealand (CC BY-NC-SA 3.0 NZ)
http://creativecommons.org/licenses/by-nc-sa/3.0/nz/
*/

var graphic;
var radiusGraphic;
var currLocation;
var currAccuracy;
var watchId;
var mapPoint;

var geolocateMode = false;

var radius, circleSymbol, ptSymbol;

var circle, ring, pts, angle;

//zoomto level
var gpsZoomLevel = 12;

function ToggleGeolocate() {
    geolocateMode = !geolocateMode;

    if (geolocateMode === true) {
        $("#gpsButton").addClass("GPSon");
        // Confirm the graphics layers are clear
        ecan.mapviewer.gpsLayer.clear();
        geoLocate(ecan.mapviewer.map);
    }
    else if (geolocateMode === false) {
        $("#gpsButton").removeClass("GPSon");
        ecan.mapviewer.gpsLayer.remove(radiusGraphic);
        radiusGraphic = null;
        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    }
}

function geoLocate() {

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
                    zoomToLocation,
                    errorCallback_highAccuracy,
                    { maximumAge: 600000, timeout: 5000, enableHighAccuracy: true }
            );

        watchId = navigator.geolocation.watchPosition(watchLocation, locationError);
    }
    else {
        alert("Browser doesn't support Geolocation.");
    }
}

function errorCallback_highAccuracy(position) {
    if (typeof (error) != undefined) {
        if (error.code == error.TIMEOUT) {
            // Attempt to get GPS loc timed out after 5 seconds, 
            // try low accuracy location
            navigator.geolocation.getCurrentPosition(
                   zoomToLocation,
                   locationError,
                   { maximumAge: 600000, timeout: 10000, enableHighAccuracy: false });
            return;
        }
    }
}

function locationError(error) {
    //error occurred so stop watchPosition
    if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        $("#gpsButton").removeClass("GPSon");
    }
    if (typeof (error) != undefined) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("Location not provided");
                break;

            case error.POSITION_UNAVAILABLE:
                alert("Current location not available");
                break;

            case error.TIMEOUT:
                alert("Timeout error");
                break;
            default:
                alert("unknown error");
                break;
        }
    }
}

function zoomToLocation(location) {
    if (debugMode) console.log(location)
    currLocation = location;
    projectToMapWkid(location, "zoom");

}

function showLocation(location) {
    projectToMapWkid(location, "show");
}
function watchLocation(location) {
    projectToMapWkid(location, "watch");
}



function createAccuracyGraphic(pt) {
    circle = new esri.geometry.Polygon(ecan.mapviewer.map.spatialReference);
    ring = []; // point that make up the circle
    pts = 40; // number of points on the circle
    angle = 360 / pts; // used to compute points on the circle
    for (var i = 1; i <= pts; i++) {
        // convert angle to raidans
        var radians = i * angle * Math.PI / 180;
        // add point to the circle
        ring.push([pt.x + radius * Math.cos(radians), pt.y + radius * Math.sin(radians)]);
    }
    ring.push(ring[0]); // start point needs to == end point
    circle.addRing(ring);
    return circle;
}

function addGraphic(pt) {
    if (debugMode) console.log('add graphic', pt);

    //circle symbol
    circleSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 8,
	      new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([21, 112, 166, 0.5]), 8),
          new dojo.Color([21, 112, 166, 0.2])
        );
    //create symbol
    ptSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 8,
	      new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
          new dojo.Color([51, 255, 51, 0.9]), 8),
          new dojo.Color([51, 255, 51, 0.2])
        );
    createAccuracyGraphic(pt);
    radiusGraphic = new esri.Graphic(circle, circleSymbol);
    //create point graphic
    graphic = new esri.Graphic(pt, ptSymbol);
    ecan.mapviewer.gpsLayer.add(graphic);
    ecan.mapviewer.gpsLayer.add(radiusGraphic);
    if (debugMode) console.log('finished loading grpahic');
}

var geomSer = null;


function projectToMapWkid(location, action) {
    if (geomSer == null) {
        geomSer = new esri.tasks.GeometryService(ecan.mapviewer.geometryURL);

    }
    if (debugMode) console.log('coords: ', location.coords.longitude, location.coords.latitude);
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(location.coords.longitude, location.coords.latitude));
    var outSR = new esri.SpatialReference({ wkid: ecan.mapviewer.map.spatialReference.wkid });

    //set radius
    radius = location.coords.accuracy / 2;
    if (debugMode) console.log('radius', radius);

    //set accuracy
    currAccuracy = location.coords.accuracy;
    if (debugMode) console.log('currAccuracy:', currAccuracy);

    geomSer.project([pt], outSR, function (projectedPoints) {
        var mapPoint = projectedPoints[0];

        if (debugMode) {
            console.log("Current Location: " + mapPoint.x.toString() + "," + mapPoint.y.toString());
        }

        if (radiusGraphic == null) {
            addGraphic(mapPoint);
        }
        else { //move the graphic if it already exists
            if (debugMode) console.log('move graphic');
            graphic.setGeometry(mapPoint);
            radiusGraphic.setGeometry(createAccuracyGraphic(mapPoint));
        }

        switch (action) {
            case "zoom":

                //check level
                if (ecan.mapviewer.map.getLevel() < gpsZoomLevel) {
                    ecan.mapviewer.map.centerAndZoom(mapPoint, gpsZoomLevel); //, 10 is the zoom factor
                } else {
                    ecan.mapviewer.map.centerAt(mapPoint);
                }
                break;
            case "show":
                ecan.mapviewer.map.centerAt(mapPoint);
                break;
            case "watch":
                ///do nothing
                //check level
                if (ecan.mapviewer.map.getLevel() < gpsZoomLevel) {
                    ecan.mapviewer.map.centerAndZoom(mapPoint, gpsZoomLevel); //, 10 is the zoom factor
                } else {
                    ecan.mapviewer.map.centerAt(mapPoint);
                }
                break;
            default:

        }
    });

}

//control button color
function toogleGPSBtn() {
    if ($('#gpsButton').hasClass('GPSon')) {
        $("#gpsButton").removeClass("GPSon");
    } else {
        $("#gpsButton").addClass("GPSon");
    };
}