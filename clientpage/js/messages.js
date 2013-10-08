/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Messaging functionality for the client
 *
 */

/**
* function that shows/hides the correct divs when using messages
*/
function showMessages() {
    $("#geolocationPar").hide();
    $("#map-canvas").hide();
    $("#map-canvas").height(0);
    $("#routes").hide();
    $("#spotlist").hide();
    $("#routeBuilder").hide();
    $("#sortableInput").html("");
    $("#spotListTable").html("");
    $("#suggestions").html("");
    $("#recommended").html("");
    $("#spotInfo").hide();
    $("#routeSpots").hide();
    $("#searchform").hide();
    $("#tabs").hide();
    $("#searchresults").html("");
    window.clearInterval(taskID);
    nearbySpotOpened = false;
    $("#generate").hide();
    $("#channels").html("");
    $("#groups").hide();
    $("#messages").show();
    displayMessages();
  }


// Show the messages
function displayMessages() {
    $("#yourMessages").empty();

    var userid = $.cookie("user_id");
    var url =  "http://" + config_serverAddress + "/messages/" + userid;
  
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onMessagesReceived,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus);
        }
    });
}


function onMessagesReceived(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var messages = data.response.messages;
        for (var i = 0; i < messages.length; i++) {
            var message = messages[i];

            var searchdata = { 
                id: message.sender_id,
                token: $.cookie("token")
            };

            var url =  "http://" + config_serverAddress + "/users/profile";
            $.ajax({
                url: url,
                data: searchdata,
                dataType: "json",
                type: "POST",
                success: function(data, textStatus, jqXHR) {
                    if (data.meta.code == 200) {
                        displayMessage(data.response, message);
                    } else {
                        alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
                    }
                },
                error: function(jqXHR, errorstatus, errorthrown) {
                    alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
                }
            });  
        }
    } else {
        alertAPIError(data.meta.message);
    }
}


function displayMessage(sender, message) {
    var first_name = sender.first_name;
    var last_name = sender.last_name;
    var thumbnail_url = sender.thumbnail_url;
    var content = message.content;
    var date = message.date;
    if (message.sender_id == $.cookie("user_id")) {
         $("#yourMessages").append("<div id='" + message.id + "'>" + 
             "<li data= '" + message.id + "'>" + 
             "<img src='" + thumbnail_url + "' alt='<profile thumbnail>' height=42 width=42>" +
             "<b>" + date + ". You said to " + first_name + " " + last_name + ": </b>" + content + "</li>");
    } else {
        $("#yourMessages").append("<div id='" + message.id + "'>" + 
            "<li data= '" + message.id + "'>" + 
            "<img src='" + thumbnail_url + "' alt='<profile thumbnail>' height=42 width=42>" +
            "<b>" + date + ". " + first_name + " " + last_name + " said: </b>" + content + "</li>");
    }
}


