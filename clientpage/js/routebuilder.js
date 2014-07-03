/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * Client-side functionality for manually building routes. 
 *
 */

// the list of spots that are used when creating the route
var spots = [];

function getSpotIdFromURL(url) {
    return (url.split("https://vikingspots.com/citylife/items/")[1]).split("/")[0];
}

/**
show the routebuilder using the spots[] variable
*/
function showRouteBuilder()  {
    $("#aside").show();
    var spot = spots[0];
    acquireSuggestedSpots(spot);
    var latitude = spot.point.latitude;
    var longitude = spot.point.longitude;
    acquireCultuurnetEventsByLatLong(latitude, longitude);
    //acquireRecommendedSpots(spots[0].link.params.id);
    
    $.each(spots, function (index, spot) {
        var id = spot.id;
        var toAdd = "<li id='spot_" + id + "' class='ui-state-default'>" + spot.data.name + "</li>";
        $("#sortable").append(toAdd);
        $("#spot_" + id).data('latlong',{latitude: latitude, longitude: longitude});
    });

    $("#routes").hide();
    
    /**
    Form to add a name and description for the new route
    */
    $("#sortableInput").html("<table><tr><td>Route Name:</td> <td><input type='text' id='routeName' value='NewRoute1'/></td></tr>" +
    "<tr><td> Route Description:</td> <td><textarea id='routeDescription' value='New Awesome Route'/></td></tr>" +
    "<tr><td>Minimum group size:</td><td><input type='number' id='minGroupSize' min='1'/> </td></tr>" +
    "<tr><td>Maximum group size:</td><td><input type='number' id='maxGroupSize' min='1'/> </td></tr></table>" +
    "<p>Start date: <input type='text' id='datepicker_from' /></p>" + 
    "<p>End date: <input type='text' id='datepicker_to' /></p>" +
    "<p><input type='button' onclick = 'addNewRoute()' value='Add this new route'/></p>");

    $("#datepicker_from").change(function () {
        var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
        var latlong = $("#" + sortItems[sortItems.length - 1].id).data("latlong");
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
    });
    $("#datepicker_to").change(function () {
        var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
        var latlong = $("#" + sortItems[sortItems.length - 1].id).data("latlong");
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
    });

    $( "#datepicker_from" ).datepicker();
    $( "#datepicker_to" ).datepicker();
    
    $("#routeBuilder").show();
    $("#searchform").show();
    $("#tabs").show();
};

/**
* @param spotID the ID of the first spot
* sets a spot as startspot
*/
function routeBuilderSetFirstSpot(spotID) {
    var startSpot;
    $.each(spots, function(index,value) {
        if (value.url == spotID) {
            startSpot = value;
        }
    });
    spots = [];
    spots.push(startSpot);
};

/**
* find relevant matches for a location using the citylife API
* @param spot the spot you want to find relevant matches for
*/
function acquireSuggestedSpots(spot) {
    var latitude = spot.point.latitude;
    var longitude = spot.point.longitude;
    var url =  "http://" + config_serverAddress + "/spots/?token=" + $.base64('btoa', $.cookie("token"), false) + "&latitude=" + latitude + "&longitude=" + longitude;
    
    $("#suggestions").html("");
    $("#tabs-1-loader").show();
    
    // send a request to the nodeJS API to acquire the relevant spots for a profile
    // parameters: bearer token, latitude and longitude
    // returns: list of relevant spots
    
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onGetSuggestedSpots,
        cache: false,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert(errorstatus + ": " + errorthrown);
        }
    });  
};


/**
 * find relevant spots for a location and a search term
 * @param latitude he latitude of the location
 * @param longitude the longitude of the location
 * @param searchTerm the search term
 */
 function acquireSuggestedSpotsBySearch( latitude, longitude, searchTerm) {
    var url = "http://" + config_serverAddress + "/spots/search/?token=" + $.base64('btoa', $.cookie("token"), false) + "&latitude=" + latitude + "&longitude=" + longitude + "&search_term=" + searchTerm;
    
    $("#searchresults").html("");
    $("#tabs-3-loader").show();
    
    // send a request to the nodeJS API to acquire the suggested spots based on a search query
    // parameters: latitude and longitude, bearer token and a search term
    // returns: list of spots    
    
    $.ajax({
        type: 'GET',
        crossDomain:true,
        url: url,
        cache: false,
        success: onGetSearchedSpots,
        error: function(jqXHR, errorstatus, errorthrown) {
            alert(errorstatus + ": " + errorthrown);
        }
    });
 }


/**
* find relevant matches for a location
* @param latitude the latitude of the location
* @param longitude the longitude of the location
*/
function acquireSuggestedSpotsByLatLong( latitude, longitude){
    var url =  "http://" + config_serverAddress + "/spots/?token=" + $.base64('btoa', $.cookie("token"), false) + "&latitude=" + latitude + "&longitude=" + longitude;
    
    $("#suggestions").html("");
    $("#tabs-1-loader").show();
    
    // send a request to the nodeJS API to acquire the relevant spots
    // parameters: latitude and longitude, bearer token
    // returns: list of spots
    
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onGetSuggestedSpots,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert(errorstatus + ": " + errorthrown);
        }
    });  
};


function acquireCultuurnetEventsByLatLong(latitude, longitude, startdate, enddate) {
    var url = "http://" + config_serverAddress + "/cultuurnet/events";

    $("#events").html("");
    $("#tabs-2-loader").show();

    $.ajax({
        url: url,
        data: {
            "latitude": latitude,
            "longitude": longitude,
            "startdate": startdate,
            "enddate": enddate
        },
        success: onGetCultuurnetEvents,
        dataType: "json",
        type: "POST"
    });
};

function onGetCultuurnetEvents(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var events_with_duplicates = data.response.rootObject;
        var events = [];
        var previous_id = "";
        for (var i = 1; i < events_with_duplicates.length; i++) {
            var event = (events_with_duplicates[i]).event;
            if (previous_id != event.cdbid) {
                events.push(event);
                previous_id = event.cdbid;
            }
        }

        var start_idx = 0;
        var end_idx = 20;
        if (end_idx > events.length) {
            end_idx = events.length;
        }

        $("#events").html("");
        $("#tabs-2-loader").hide();
        for (var i = start_idx; i < end_idx; i++) {
            var event = events[i];
            var id = event.cdbid;
            var eventdetails = (event.eventdetails.eventdetail)[0];
            var calendar_summary = eventdetails.calendarsummary;
            var title = eventdetails.title;
            var description = eventdetails.shortdescription;
            $("#events").append("<li onclick='addEvent(" + i + ")' id='suggestedEvent_" + id + "'>" +
                "<b>" + title + "</b><br/>" + description + "<br/><b>Calendar: </b>" + calendar_summary + "</li>");

            var gis = ((event.contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
            $("#suggestedEvent_" + id).data('latlong',{ latitude: gis.ycoordinate, longitude: gis.xcoordinate });
        };
    } else {
        alertAPIError(data.meta.message);
    }
}


/**
 * callback function after acquiring a list of searched spots
 */
function onGetSearchedSpots(data, textStatus, jqXHR) {
        
    if (data.meta.code == 200) {
        // clear the searched list
        $("#searchresults").html("");
        $("#tabs-3-loader").hide();
        var spots = JSON.parse(data.response);
        $.each(spots, function(index, value) {
            var id = getSpotIdFromURL(value.item);
            $("#searchresults").append("<li onclick='addSearchedSpot(" + index + ")' id='searchedSpot_" + id + "'>" +
                "<span class='ui-icon ui-icon-plus'></span> " + value.detail_data.title + "<br/>" + value.detail_data.description + "</li>");
        });
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* callback function ater acquiring a list of relevant spots
*/
function onGetSuggestedSpots(data, textStatus, jqXHR) {
    var browserHeight = $(window).height();
    if (data.meta.code == 200) {
        $("#suggestions").html("");
        $("#tabs-1-loader").hide();

        $.each(data.response, function(index, value){
            var id = getSpotIdFromURL(value.item);
            var image = value.discover_card_data.image_url;
            if (image === null || image.length == 0) {
              image = "http://www.viamusica.com/images/icon_location02.gif";
            }
            $("#suggestions").append("<li onclick='addSuggestedSpot(" + index + ")' id='suggestedSpot_" + id + "'>" +
                     value.detail_data.title
                    + "<br></br><img src='" + image + "' alt='<spot image>' height='" + (browserHeight/6) + "'><br></br>");

            if ((value.offers.count == 0) && (value.spend_offers.count == 0)) {
                $("#suggestedSpot_" + id).append("<div>No deals at this spot</div>");
            } else {
                var deal_amount = value.offers.count + value.spend_offers.count;

                function showTooltip() {
                    var earn_deals = value.offers.results;
                    var spend_deals = value.spend_offers.results;
                    var deals_html = "<div id='tooltip' class='tooltip'>";
                    
                    for (var i = 0; i < earn_deals.length; i++) {
                        var deal = earn_deals[i];
                        var description_html = "";
                        if (deal.description) { description_html = "<br>" + deal.description; }
                        deals_html = deals_html + "<li> <div> <b>Earn: </b>" +
                            "<b>" + deal.title + "</b>" + description_html + "<br>" + 
                            //"Bring N friends" +
                            "</div></li>";
                    };
                    for (var i = 0; i < spend_deals.length; i++) {
                        var deal = spend_deals[i];
                        if (deal.description) { description_html = "<br>" + deal.description; }
                        deals_html = deals_html + "<li> <div> <b>Spend: </b>" +
                            "<b>" + deal.title + "</b>" + description_html + "<br> Cost: " + deal.city_coins + " fonskes" + "<br>" + 
                            //"Bring N friends" +
                            "</div></li>";
                    };
                    deals_html = deals_html + "<br></div>";
                    var tooltip = $(deals_html);
                    tooltip.appendTo($("#open_deals_dialog_" + id));
                }

                function hideTooltip() {
                    clearTimeout(tooltipTimeout);
                    $("#tooltip").fadeOut().remove();
                }
                
                var deals_postfix = " deals";
                if (deal_amount < 2) { deals_postfix = " deal" }
                $("#suggestedSpot_" + id).append("<div id='open_deals_dialog_" + id + "'><u>" + deal_amount + deals_postfix + "</u></div>");
                $("#open_deals_dialog_" + id).hover(function() {
                        tooltipTimeout = setTimeout(showTooltip, 1000);
                    }, 
                    hideTooltip);
            }

            $("#suggestedSpot_" + id).append("</li>");

            // add latlong data to the DOM elements (prevent requesting the spotinfo again)
            $("#suggestedSpot_" + id).data('latlong',{latitude: value.point.latitude, longitude: value.point.longitude});
        });
    } else {
        alertAPIError(data.meta.message);
    }
};



/**
 * add a searched spot as next stop in the route
 * @param the position in the list of searched spots
 */
function addSearchedSpot( listID ) {
    var listitems = document.getElementById("searchresults").getElementsByTagName("li");
    var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
    
    if (sortItems.length >= 10) {
        alert("The current API allows maximum 8 intermediate points.");
    } else {
        var spotID = listitems[listID].id.split('_')[1];
        var spotName = listitems[listID].innerHTML;
        var toAdd = "<li id='spot_" + spotID + "' class='ui-state-default'>" + spotName + "<span onclick=deleteItem('spot_" + spotID + "');>delete</span></li>";
        $("#sortable").append(toAdd);
        //acquireRecommendedSpots(spotID);
        acquireRelevantSpotsFromSearch(spotID);
    }
    $("#searchresults").html("");
};

/**
* get relevant spots based on a spot found by search
* @param: the ID of the spot on which the relevance is based
*/
function acquireRelevantSpotsFromSearch(spotID) {
    // we need the lat long information to get relevant spots. first acquire spot info
    var url = "http://" + config_serverAddress + "/spots/findbyid?id=" + spotID + "&token=" + $.base64('btoa', $.cookie("token"), false);
    
    // send a request to the nodeJS API to get information about a spot
    // parameters: the spot id
    // returns: information about the spot
    
    $.ajax({
        type: 'GET',
        crossDomain:true,
        url: url,
        cache: false,
        success: onGetRelevantSpotsFromSearch,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert(errorstatus + ": " + errorthrown);
        }
    });     
};

/**
* callback function after getting information about a spot
* now the lat long is known, the relevant spot can be found
**/
function onGetRelevantSpotsFromSearch(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    if (data.meta.code == 200) {
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireSuggestedSpotsByLatLong(data.response.point.latitude, data.response.point.longitude);
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* add a suggested spot as next stop in the route
* @param the position in the list of suggested spots
*/
function addSuggestedSpot( listID ) {
    var listitems = document.getElementById("suggestions").getElementsByTagName("li");  
    var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
    
    if (sortItems.length >= 10) {
        alert("The current API allows maximum 8 intermediate points.");
    } else {
        var spotID = listitems[listID].id.split('_')[1] ;
        var spotName = listitems[listID].innerHTML;
        var toAdd = "<li id='spot_" + spotID + "' class='ui-state-default'>" + spotName + "<span onclick=deleteItem('spot_" + spotID + "');>delete</span></li>";
        //$("#sortable").append("<li id='spot_" + spotID + "'>" + spotName + "</li>");
        $("#sortable").append(toAdd);
        var latlong = $("#" + listitems[listID].id).data("latlong");
        $("#spot_" + spotID).data('latlong', {latitude: latlong.latitude, longitude: latlong.longitude});
        acquireSuggestedSpotsByLatLong(latlong.latitude, latlong.longitude);
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
        //acquireRecommendedSpots(spotID);
    }
};


function addEvent(listID) {
    var listitems = document.getElementById("events").getElementsByTagName("li");  
    var sortItems = document.getElementById("sortable").getElementsByTagName("li");

    if (sortItems.length >= 10) {
        alert("The current API allows maximum 8 intermediate points.");
    } else {
        var eventID = listitems[listID].id.split('_')[1] ;
        var eventName = listitems[listID].innerHTML;
        var toAdd = "<li id='event_" + eventID + "' class='ui-state-default'>Event: " + eventName + "<span onclick=deleteItem('event_" + eventID + "');>delete</span></li>";
        //$("#sortable").append("<li id='spot_" + spotID + "'>" + spotName + "</li>");
        $("#sortable").append(toAdd);
        var latlong = $("#" + listitems[listID].id).data("latlong");
        $("#event_" + eventID).data('latlong', {latitude: latlong.latitude, longitude: latlong.longitude});
        acquireSuggestedSpotsByLatLong(latlong.latitude, latlong.longitude);
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
    }
}

/**
* remove an item when building a list
* @param the DOM id of the item to be removed
*/
function deleteItem(itemID){
    $('#' + itemID).remove();
};

/**
* Get a recommended spot based on the VikingPatterns API
* @param the spot ID
*/
function acquireRecommendedSpots(spotID) {
    var url = config_WhatsNextAddress + $.cookie("token") + "/whatsnext/" +spotID + "/";
    $("#recommended").html("");
    $("#tabs-2-loader").show();
    
    // send a request to the WhatsNext API to acquire the recommended spots
    // parameters: spotID and bearer token
    // returns: list of recommendedspots
    
    $.ajax({
       type: 'GET',
        url: url,
        success: onGetRecommendedSpots,
        dataType:"json",
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("The what's next API is having some problems");
        }
    });  
};

/**
* callback function after requesting recommended spots
*/
function onGetRecommendedSpots(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        $("#recommended").html("");
        $("#tabs-2-loader").hide();
        if (data.response.count > 0) {
            
            $.each(data.response.spots,function(index,value){
            
                $("#recommended").append("<li onclick='addRecommendedSpot(" + index + ")' id='recommendedSpot_" + value.id + "'>" +
                        "<span class='ui-icon ui-icon-plus'></span> " + value.name);
                

                $("#recommendedSpot_" + value.id).append("</li>");

                // add latlong data to the DOM elements (prevent requesting the spotinfo again)
                $("#recommendedSpot_" + value.id).data('latlong',{latitude: value.latitude, longitude: value.longitude});
            });
        }
        else
            $("#recommended").html("There are no recommended spots for this spot.");

        
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* add a the selected recommended spot to the list
* @param the id of the selected spot
*/
function addRecommendedSpot( listID ) {
    var listitems = document.getElementById("recommended").getElementsByTagName("li");  
    var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
    
    if (sortItems.length >= 10) {
        alert("The current API allows maximum 8 intermediate points.");
    } else {
        var spotID = listitems[listID].id.split('_')[1] ;
        var spotName = listitems[listID].innerHTML;
        var toAdd = "<li id='spot_" + spotID + "' class='ui-state-default'>" + spotName + "<span onclick=deleteItem('spot_" + spotID + "');>delete</span></li>";
        $("#sortable").append(toAdd);
        var latlong = $("#" + listitems[listID].id).data("latlong");
        $("#spot_" + spotID).data('latlong',{latitude: latlong.latitude, longitude: latlong.longitude});
        acquireSuggestedSpotsByLatLong(latlong.latitude, latlong.longitude);
        var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
        var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
        acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
        //acquireRecommendedSpots(spotID);
    }
   
};



/**
Add a spot for the routeBuilder
*/
function routeBuilderAddSpot( spot ) {
    function getChannelItemFromChannelEntry(entry, callback) {
        var url = entry.item;
        $.ajax({
            type: 'GET',
            crossDomain:true,
            url: url,
            cache: false,
            dataType:"json",
            beforeSend: function(xhr) { xhr.setRequestHeader("Authorization", "Bearer " + $.cookie("token")); },
            success: function(spot, textStatus, jqXHR) {
                callback(spot);
            },
            error: function(jqXHR, errorstatus, errorthrown) {
                alert(errorstatus + ": " + errorthrown);
            }
        });  
    }

    getChannelItemFromChannelEntry(spot, function (s) {
        spots.push(s);
    });
};

/**
clear the routebuilder spots
*/
function routeBuilderClearSpots() {
    spots.length = 0;
     $("#sortable").html("");
};

/**
add a new route to the database
*/
function addNewRoute() {
    var minGroupSize = parseInt($("#minGroupSize").val());
    var maxGroupSize = parseInt($("#maxGroupSize").val());
    var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
    var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
    if (minGroupSize != null && maxGroupSize != null && minGroupSize > maxGroupSize) {
        alert("Minimum group cannot be larger than maximum group size!");
    } else {
        var items = document.getElementById("sortable").getElementsByTagName("li");   
        var points = [];
        $.each(items, function (index, value) {
                                if (index <= 10 ){ // API allows max. 8 waypoints
                                    var event_id_stripped = value.id.split("event_");
                                    if (event_id_stripped.length > 1) {
                                        // We have a CultuurNet event
                                        points.push({'event': ("http://search.uitdatabank.be/search/rest/detail/event/" + event_id_stripped[1]) });
                                    } else {
                                        // We have a CityLife spot
                                        var id = parseInt((value.id.split('_')[1]));
                                        points.push({'item': ("https://vikingspots.com/citylife/items/" + id + "/") });  
                                    }                             
                                }
                            });
    
        var newRoute = {
                    name: $("#routeName").val(),
                    description: $("#routeDescription").val(),
                    points: points,
                    minimumGroupSize: minGroupSize, 
                    maximumGroupSize: maxGroupSize,
                    startDate: startdate,
                    endDate: enddate,
                    token: $.cookie("token")
                };
        var url =  "http://" + config_serverAddress + "/routes/";
    
        // send a POST to the nodeJS API to save a route
        // parameters: the route information: the name , description and a list of points in JSON format
        // returns: the route ID
        $.ajax({
            url: url,
            data: newRoute,
            success: onRouteAdded,
            dataType: "json",
            type: "POST"
        });
    }
};

/**
callback function after adding a route
*/
function onRouteAdded(data, textStatus, jqXHR) {
    if (data.meta.code == 200)
    {
        selectRoute(data.response.id);
        $("#routeBuilder").hide();
        $("#searchform").hide();
        $("#sortableInput").html("");
        $("#sortable").html("");
        $("#suggestions").html("");
        $("#recommended").html("");
        $("#searchresults").html("");
        $("#tabs").hide();
    } else {
        alertAPIError(data.meta.message);
    }
    
};

function search(){
    var searchTerm = $("#searchTerm").val();
    navigator.geolocation.getCurrentPosition( function (position) {
            
        acquireSuggestedSpotsBySearch( position.coords.latitude, position.coords.longitude, searchTerm);
            
    });
};

