/*
Copyright License  - Canterbury Regional Council and Partners
Attribution-NonCommercial-ShareAlike 3.0 New Zealand (CC BY-NC-SA 3.0 NZ)
http://creativecommons.org/licenses/by-nc-sa/3.0/nz/
*/

/// Includes
dojo.require('esri.arcgis.Portal');
dojo.require("esri.IdentityManager");
dojo.require("dojox.lang.aspect");

//QUICK MAPS STUFF

/* -----------------------------------------------------------------------
Expects references to quickmaps.config.viewerURL & quickmaps.config.displayOptions from quickmaps.config.js file
----------------------------------------------------------------------- */
ecan.mapviewer.Gallery = {};
ecan.mapviewer.Gallery.portal = null;
ecan.mapviewer.Gallery.group = null;
ecan.mapviewer.Gallery.nextQueryParams = null;
ecan.mapviewer.Gallery.queryParams = null;
ecan.mapviewer.Gallery.settings = null;


ecan.mapviewer.Gallery.QuickMapsExtent = function () {
    var myAnchor="", mapExtent;
    //add extent to url
    if (ecan.mapviewer.map) {
        mapExtent = ecan.mapviewer.map.extent;
        myAnchor = "&extent=" + mapExtent.xmin + "," + mapExtent.ymin + "," + mapExtent.xmax + "," + mapExtent.ymax;
    }
    return myAnchor;
}

///function to help change the map
ecan.mapviewer.Gallery.QuickMapsChangeMap = function (mapid) {

    $('#mapContainer').addClass('loading');

    //is it run first?
    if (ecan.mapviewer.map != null) {

        //make sure results are cleared
        ecan.mapviewer.clearSelection();

        //remove old map plus base map gallery digit
        ecan.mapviewer.map.destroy();
        //remove gallery 
        ecan.mapviewer.basemapGallery.destroy();
        //remove scalebar digit
        if (ecan.mapviewer.scalebar != null)
            ecan.mapviewer.scalebar.destroy();
        //and re-add base map gallery component
        $('#basemapContainer').html('<div id="basemapGallery"></div>');
       
    }

    //load or re-load map with new mapid
    init(mapid);
    //close dialog
    $('#quickmapsDialog').dialog('close');
}

ecan.mapviewer.Gallery.QuickMapsinit = function () {

    if (debugMode) console.log('start quick maps init');

    // Load the groups list
    if (quickmaps.config.displayOptions.mapGroups.length > 0) {
        var html = "<div class='groupTitle'><div class='groupLogo'></div><div class='groupText'><h4>Maps Groups</h4><span>Click one of the icons from the map group categories list to display a list of maps within that category</span></div></div><ul>";
        var i = 0;

        $.each(quickmaps.config.displayOptions.mapGroups, function () {
            html += "<li groupID='" + this.groupID + "' ";

            if (i == 0) {
                html += " class='clicked' title='Click to display the contents of this group' >";
            }
            else {
                html += " title='Click to display the contents of this group' >";
            }
            html += "<div class='groupItem' title='" + this.groupName + "'><img src='" + "Content/images/48x48/" + this.icon + "' alt='Icon' class='groupItemIcon'/><span class='groupItemTitle'>" + truncate(this.groupName, 25) + "</span></div></li>";
            i++;
        });

        html += "</ul>";


        // Append html to the group location and clear the loading class
        $("#groupList").html(html).removeClass("loading");

        if (debugMode) console.log('appended html to dialog', html);
       

            // GROUPS ONCLICK FUNCTION
            $(document).on('click', '#groupList ul li', function (event) {
                // Clear the current selected item 
                $("#groupList ul li").removeClass("selected").removeClass("clicked");

                // CLICKED
                $(this).addClass('clicked').addClass('selected');
                callPortal($(this).attr('groupID'));
            });

            $('#back').on('click', function () { ecan.mapviewer.Gallery.goback() });
    }
    
    //// Initialise the portal
    ecan.mapviewer.Gallery.portal = new esri.arcgis.Portal(quickmaps.config.displayOptions.portalUrl);
    if (debugMode) console.log('Initialised the portal');

    dojox.lang.aspect.advise(ecan.mapviewer.Gallery.portal, "queryItems", {
        afterReturning: function (queryItemsPromise) {
            queryItemsPromise.then(function (result) {
                ecan.mapviewer.Gallery.nextQueryParams = result.nextQueryParams;
                ecan.mapviewer.Gallery.queryParams = result.queryParams;
            });
        }
    });

}  //end of init call


//go back function to show start of gallery page.
ecan.mapviewer.Gallery.goback = function () { $('#groupContents').hide('fast', function () { $('#groupList').show('fast'); }); };


/* Manipulation Functions
---------------------------------------------------------------------- */

truncate = function (text, length, ellipsis) {
    var defaultLength = 100;
    if (!length) {
        length = defaultLength;
    }
    if (!ellipsis) {
        var ellipsis = '&hellip;';
    }
    if (text.length < length) {
        return text;
    }
    else {
        for (var i = length - 1; text.charAt(i) != ' ' && i >= 0; i--) {
            length--;
        }
        if (length <= 0) {
            length = defaultLength;
        }
        return text.substr(0, length) + ellipsis;
    }
};





/* Portal Functions
---------------------------------------------------------------------- */

loadPortal = function () {
    callPortal(quickmaps.config.displayOptions.group.id);
}

callPortal = function (id, data_offset) {
    // Hide the map list
    $('#groupList').hide('fast', function () { $('#groupContents').show('fast'); });

    var params = {};

    if (id == null) {
        params.q = 'id: ' + quickmaps.config.displayOptions.group.id;
    }
    else {
        params.q = 'id: ' + id;
        quickmaps.config.displayOptions.group.id = id;
    }

    if (!data_offset)
        var data_offset = 1;

    if (ecan.mapviewer.Gallery.settings == null) {
        // Set defaults
        ecan.mapviewer.Gallery.settings = {
            pagination: true,
            paginationSize: 2,
            paginationShowFirstLast: true,
            paginationShowPrevNext: true,
            perPage: quickmaps.config.displayOptions.numItemsPerPage,
            perRow: 4,
            searchStart: data_offset 
        };
    }
    else {
        ecan.mapviewer.Gallery.settings.searchStart = data_offset;
    }

    ecan.mapviewer.Gallery.portal.queryGroups(params).then(function (groups) {
        // Get group title and thumbnail url         
        if (groups.results.length > 0) {
            ecan.mapviewer.Gallery.group = groups.results[0];

            if (ecan.mapviewer.Gallery.group.thumbnailUrl) {
                $('#groupThumbnail').html("<img src='" + ecan.mapviewer.Gallery.group.thumbnailUrl + "' alt='" + ecan.mapviewer.Gallery.group.title + "' style='width: 64px; height: 64px' />");
            }

            $('#groupTitle').html(ecan.mapviewer.Gallery.group.title);
            $('#groupDescription').html(ecan.mapviewer.Gallery.group.snippet);

            // calculate the start position
            var startpos = 1;
            if (ecan.mapviewer.Gallery.settings.searchStart > 1) {
                startpos = (ecan.mapviewer.Gallery.settings.searchStart - 1) * quickmaps.config.displayOptions.numItemsPerPage + 1;
            }

            // Retrieve the web maps and applications from the group and display           
            var params = {
                q: ' type: Web Map -Application',
                num: quickmaps.config.displayOptions.numItemsPerPage,
                start: startpos
            };

            // Hide the current contents list 
            $('#galleryList').hide();
            $('#maps_pagination').hide();

            // Call the contents
            ecan.mapviewer.Gallery.group.queryItems(params).then(updateGrid);
        }
    });
}

updateGrid = function (data) {
    $('#galleryList').html('');
    // HTML VARIABLE
    var html = '';

    // GET TOTAL RESULTS
    var totalItems = data.total;
    var totalResults = data.results.length;

    // IF WE HAVE ITEMS
    if (totalResults > 0) {

        // CREATE LIST ITEMS
        for (var i = 0; i < totalResults; ++i) {
            // variables
            var itemTitle;
            var itemURL;
            var infoURL;
            var snippet;
            var linkTarget;
            var externalLink = false;

            var appClass = '';
            // IF ITEM HAS URL
            if (data.results[i].url) {
                itemURL = data.results[i].url;
            }
            else {
                // url variable
                //for direct url access itemURL = quickmaps.config.viewerURL + data.results[i].id;
                itemURL = data.results[i].id;
            }

            itemTitle = data.results[i].title;
            snippet = '';
            if (data.results[i].snippet) {
                snippet = data.results[i].snippet;
            }

            // Build list item
            html += '<div class="item">';
            html += '<a id="mapItem' + i + '" title="' + itemTitle + '" href="#' + quickmaps.config.viewerVar + '=' + data.results[i].id  +ecan.mapviewer.Gallery.QuickMapsExtent() + '" onclick="javascript:ecan.mapviewer.Gallery.QuickMapsChangeMap(&#39;' + itemURL + '&#39;)">';
            html += '<img alt="' + itemTitle + '" src="' + data.results[i].thumbnailUrl + '" width="200" height="133" class="block" />';
            html += '<div class="itemInfo">';
            html += '<strong>' + itemTitle + '</strong>';
            // vars
            var modifiedDate, modifiedLocalized;
            // modified date
            if (data.results[i].modified) {
                // date object
                modifiedDate = new Date(data.results[i].modified);
                // date format for locale
                modifiedLocalized = modifiedDate.format('dddd, mmm d, yyyy');
            }
            // html
            html += '<p class="dateInfo">';
            html += data.results[i].type + ' ';
            html += 'by ';
            html += data.results[i].owner;
            html += '. ';
            if (modifiedLocalized) {
                html += 'Last modified ' + modifiedLocalized + '. ';
            }
            html += '</p>';
            html += '<p>' + snippet + '</p>';
            // rating container
            html += '<div class="ratingCon">';
            if (quickmaps.config.showRatings) {
                //html += widget.domNode.outerHTML;
            }
            var rating = '';
            if (quickmaps.config.showRatings) {
                // Ratings
                if (data.results[i].numRatings) {
                    var pluralRatings = 'rating';
                    if (data.results[i].numRatings > 1) {
                        pluralRatings = 'ratings';
                    }
                    rating += data.results[i].numRatings + ' ' + pluralRatings;
                }
            }
            if (quickmaps.config.showComments) {
                // comments
                if (data.results[i].numComments) {
                    if (data.results[i].numRatings) {
                        rating += ', ';
                    }
                    var pluralComments = 'comment';
                    if (data.results[i].numComments > 1) {
                        pluralComments = 'comments';
                    }
                    rating += data.results[i].numComments + ' ' + pluralComments;
                }
            }
            // views
            if (quickmaps.config.showViews && data.results[i].numViews) {
                if ((data.results[i].numRatings && quickmaps.config.showRatings) || (data.results[i].numComments && quickmaps.config.showComments)) {
                    rating += ', ';
                }
                var pluralViews = 'view';
                if (data.results[i].numViews > 1) {
                    pluralViews = 'views';
                }
                rating += data.results[i].numViews + ' ' + pluralViews;
            }

            if (rating) {
                html += ' (' + rating + ')';
            }
            if (externalLink) {
                html += '<span class="iconCon"><span class="icon external"></span>';
            }
            html += '</div>';
            html += '</div>';
            html += '<div class="clear"></div>';
            html += '</a></div>';
            html += '<div class="clear"></div>';
        }
    }
    else {
        // NO RESULTS
        html += '<p>No maps were found.</p><div class="clear"></div>';
    }

    $('#galleryList').html(html).show();

    // CREATE PAGINATION
    createPagination(ecan.mapviewer.Gallery.settings, totalItems, '#maps_pagination');

    // Scroll to top of the dialog
    $("#quickmapsDialog").scrollTop("0");
}


/* CREATE PAGINATION FUNCTION
-----------------------------------------------------------------------------------------------*/
createPagination = function (obj, totalItems, pagObject) {
    // IF PAGINATION IS NECESSARY
    if (obj.pagination && obj.perPage && totalItems > obj.perPage) {
        // CREATE PAGINATION LIST
        var pagination = '<ul>';
        // DETERMINE OFFSET LINKS
        var current = parseInt(obj.searchStart);
        var first = 1;
        var previous = current - 1;
        var next = current + 1;
        var last = Math.ceil(totalItems / obj.perPage);
        var shown = 0;
        // PAGINATION PREVIOUS
        if (obj.paginationShowPrevNext) {
            var firstClass = 'disabled';
            if (obj.searchStart > 1) {
                firstClass = '';
            }
            pagination += '<li title="Previous" class="previous ' + firstClass + '" data-offset="' + previous + '"><span class="arrowButton buttonLeft"><span></span></span></li>';
        }
        if (obj.paginationShowFirstLast && current > (obj.paginationSize + 1)) {
            pagination += '<li title="First Page" data-offset="' + first + '"><span class="default">' + first + '</span></li><li><sub>&hellip;</sub></span></li>';
            shown = shown + 2;
        }
        // CREATE EACH PAGINATION ITEM
        for (var i = 1; i <= last; ++i) {
            if (i <= (current + obj.paginationSize) && i >= (current - obj.paginationSize)) {
                // CLASS
                var selectedClass = '';
                if (i == obj.searchStart) {
                    // IF SELECTED
                    selectedClass = 'selected';
                }
                // PAGE LIST ITEM
                pagination += '<li title="Page ' + i + '" data-offset="' + i + '" class="' + selectedClass + '"><span class="default">' + i + '</span></li>';
                shown++;
            }
        }
        // PAGINATION AFTER
        if (obj.paginationShowFirstLast && current < (last - obj.paginationSize)) {
            pagination += '<li><sub>&hellip;</sub></span></li><li title="Last Page" data-offset="' + last + '"><span class="default">' + last + '</span></li>';
            shown = shown + 2;
        }
        // PAGINATION NEXT
        if (obj.paginationShowPrevNext) {
            var lastClass = 'disabled';
            if (obj.searchStart < last) {
                lastClass = '';
            }
            pagination += '<li title="Next" class="next ' + lastClass + '" data-offset="' + next + '"><span class="arrowButton buttonRight"><span></span></span></li>';
        }
        // END PAGINATION
        pagination += '</ul><div class="clear"></div>';
        // INSERT INTO HTML
        $(pagObject).html(pagination).show();
    }
    else {
        $(pagObject).html('').show();
    }
}


var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

// FEATURED MAPS PAGINATION ONCLICK FUNCTION
$(document).on('click', '#maps_pagination ul li:not(.selected, .disabled, .clicked)[data-offset]', function (event) {
    // CLICKED
    $(this).addClass('clicked');

    // ADD LOADING SPINNER
    $('#maps_pagination ul').append('<li><span class="loadingAjax"></span></li>');

    // GET OFFSET NUMBER
    var data_offset = $(this).attr('data-offset');
    ecan.mapviewer.Gallery.settings.dataOffset = data_offset;

    // QUERY MAPS FUNCTION
    callPortal(null, data_offset);
});
