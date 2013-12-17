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
    
    navigator.geolocation.getCurrentPosition(onLocationKnown,function(err){
        alert("Could not request geolocation");
        },
        {timeout:10000});
};

/**
* callback function for the geolocation API
* @param position: the current position
*/
function onLocationKnown(position) {
    $("#geolocationPar").html("Latitude: " + position.coords.latitude +  "</br>Longitude: " + position.coords.longitude);   
    
   // send a request to the nodeJS API to acquire the nearby spots
   // parameters: latitude and longitude
   // returns: list of spots
    var url =  "http://" + config_serverAddress + "/spots?latitude=" + position.coords.latitude + "&longitude=" + position.coords.longitude;
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onGetSpots,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus);
        }
    });
};

/**
* callback function after the call in showPosition
* parse the list of nearby spots and show them
*/
function onGetSpots(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var browserHeight = $(window).height();
        var browserWidth= $(window).width();

        // clear the list of spots for the routebuilder
        routeBuilderClearSpots();
        $.each(data.response, function(index, value) {
            var image = value.discover_card_data.image_url;
            if (image === null) {
              image = "http://www.viamusica.com/images/icon_location02.gif";
            }
            $('#spotListTable').append(
                '<tr><td><b>' + value.detail_data.title + '</b></td>' + 
                '<td>' +  "<img src='" + image + "' alt='<spot image>' width='" + (browserWidth/6) + "'>" + '</td>' + 
                //'<td>' + value.detail_data.description + 
                '</td><td> <input type="button" onclick="checkIn(' + "'" + value.item + "'" + "," + "'" + value.channel + "'" + ')" value="Check In" /></tr>');
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
       crossDomain:true,
        url: url,
        cache: false,
        success: onCheckedIn,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus);
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
                    var messagesTab = $('#messagesTab');
                    var link = $(messagesTab.children()[0]);
                    var new_messages_label = "Messages -- " + message.data + " new";
                    link.text(new_messages_label);
                }
            }
        }

        routeBuilderSetFirstSpot((JSON.parse(data.response)).id);
        $("#map-canvas").height(0);

        $("#generateTab").show();
        $("#groupsTab").show();
        $("#messagesTab").show();
        showRoute((JSON.parse(data.response)).item_id);
    } else {
        alert("The Citylife API returned an error. This could be caused by an expired session or you checked in too quickly on the same spot.");
        //logOut();
    }    
}