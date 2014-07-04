/**
* @author: Mathias Raets
* @copyright: OFKN be
* This file provides nearby spot and check-in functionality
*/

/**
* acquire geolocation
*/
var googleKey = "";
var dirService;
var dirDisplay;
var routeData;


/**
* get the geo location
*/
function getGeolocation() {
    //$.getScript("/js/auth/apikey.js",function(){googleKey = mapsapikey});
    onLocationKnown();
    //navigator.geolocation.getCurrentPosition(onLocationKnown, onLocationError, {timeout: 10000});
};


function getSpotDataFromChannelEntry(channel_entry, callback) {
    var item_url = channel_entry.item;
    $.ajax({
        type: 'GET',
        crossDomain:true,
        url: item_url,
        cache: false,
        dataType:"json",
        beforeSend: function(xhr) { xhr.setRequestHeader("Authorization", "Bearer " + $.cookie("token")); },
        success: function(item, textStatus, jqXHR) {
            callback(item);
        },
        error: function(jqXHR, errorstatus, errorthrown) {
            console.log(errorstatus + ": " + errorthrown);
        }
    });  
}

/**
* callback function for the geolocation API
* @param position: the current position
*/
function onLocationKnown(position) {
    position = {
      "timestamp": 1404387513281,
      "coords": {
        "speed": null,
        "heading": null,
        "altitudeAccuracy": null,
        "accuracy": 37,
        "altitude": null,
        "longitude": 3.2701124999999998,
        "latitude": 50.8006804
      }
    };
    $("#geolocationPar").html("Latitude: " + position.coords.latitude +  "</br>Longitude: " + position.coords.longitude);   

   // send a request to the nodeJS API to acquire the nearby spots
   // parameters: latitude and longitude
   // returns: list of spots

   console.log("onLocationKnown")
    var url =  "http://" + config_serverAddress + "/spots.json?latitude=" + 
        position.coords.latitude + 
        "&longitude=" + position.coords.longitude +
        "&token=" + $.base64('btoa', $.cookie("token"), false);
    
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onGetSpots,
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
};

/**
* callback function for the geolocation API if location was not found within time
* @param PositionError
*/
function onLocationError(error) {
    $("#geolocationPar").html("Location not found within 10 seconds");   
    
    console.log(error);
};

/**
* callback function after the call in showPosition
* parse the list of nearby spots and show them
*/
function onGetSpots(data, textStatus, jqXHR) {
    changeView('spots');
    if (data.meta.code == 200) {
        var browserHeight = $(window).height();
        var browserWidth= $(window).width();

        // clear the list of spots for the routebuilder
        routeBuilderClearSpots();
        $.each(data.response, function(index, value) {
            var image = value.discover_card_data.image_url;
            if (image === null || image.length == 0) {
              image = "http://www.viamusica.com/images/icon_location02.gif";
            }
            var shortDescription = value.detail_data.description;
            if(shortDescription.length > 200){
                shortDescription = shortDescription.substring(0,150) + '... <a href="#">Expand</a>';
            }
            var channel = value.channel;
            var id = value.item;
            $('#spotList').append(
                '<div class="spot spot-nearby">' +
                '<div class="spot-image" style="background-image:url(' + image + ')"></div>' +
                '<div class="spot-data"><div class="clearfix">' +
                '<h4 class="spot-title">' + value.discover_card_data.title + '</h4>' +
                '<p class="spot-addr">' + value.detail_data.address + '</p></div>' +
                '<p class="spot-descr">' + shortDescription + '</p>' +
                '<p class="spot-checkin"><button type="button" ' +
                'onclick="checkIn(\'' + id + "','" + channel + '\')" class="btn btn-default">Check In</button></p>' +
                '</div>' +
                '</div>'
                );
            $("#geolocationPar").hide();
            $("#spotList").show();
            routeBuilderAddSpot(value);
        });
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* check in at a given spot
* @param spotID the id of the spot where you want to check in
*/
function checkIn( spotID, channelID ) {

    // send a request to the nodeJS API to check in at a spot
    // parameters: the bearer token and the spot id
    // returns: confirmation of the check-in, spot ID
    var url =  "http://" + config_serverAddress + "/spots/checkin?spot_id=" + spotID + "&channel=" + channelID + "&token=" + $.base64('btoa', $.cookie("token"), false);
    $.ajax({
       type: 'GET',
       crossDomain: true,
        url: url,
        cache: false,
        success: onCheckedIn,
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
};

/**
* callback function when checked in
*/
function onCheckedIn(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var http_host = window.document.location.origin.replace(/^http/, 'ws');
        var ws_host = (http_host.split(":"))[0] + ":" + (http_host.split(":"))[1] + ":" + 5000;
        if (WS === null) {
            WS = new WebSocket(ws_host);
        }

        WS.onopen = function() {
            console.log("websocket to server " + ws_host + " successfully opened.");
            WS.onmessage = function(message) {
                if (message.data == 'new_messages_for_user?') {
                    WS.send($.cookie("user_id"));
                } else {
                    /* $('#navMessages b').text(...) would be cleaner
                    *  but that <b> might be changed without knowing this dependency */
                    $('#navMessages').html('Messages <b>' + message.data + ' new</b>');
                }
            }
        }
        routeBuilderSetFirstSpot(data.response.url);
        $("#map-canvas").height(0);

        $("#generateTab").show();
        $("#groupsTab").show();
        $("#messagesTab").show();
        showRoute(data.response.url);
    } else {
        console.log("The Citylife API returned an error. This could be caused by an expired session or you checked in too quickly on the same spot.");
        //logOut();
    }    
}