/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * this file contains the logic to automatically generate routes
 *
 */


var RADIUS = 5; // the maximum distance for a next spot in a generated route(in km)
var generatedRoute = false;;

/**
* generate a route based on a channel and a current spot
*/
function autoGenerateRoute() {
    var entry = spots[0];
    var token = $.cookie("token");
    var channelname = $('#channelList').find(":selected").val();
    var minGroupSize = parseInt($('#minGroupSizeGenerate').val());
    var maxGroupSize = parseInt($('#maxGroupSizeGenerate').val());
    var startdate = $( "#datepicker_from_generate" ).datepicker( "getDate" );
    var enddate = $( "#datepicker_to_generate" ).datepicker( "getDate" );

    function getSpotDataFromChannelEntry(channel_entry, callback) {
        var item_url = channel_entry.url;
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

    if (minGroupSize != null && maxGroupSize != null && minGroupSize > maxGroupSize) {
        console.log("Minimum group cannot be larger than maximum group size!");
    } else {
        getSpotDataFromChannelEntry(entry, function(spot) {
            var latitude = spot.point.latitude;
            var longitude = spot.point.longitude;
            var id = spot.item_id;

            var url = "http://" + config_serverAddress + "/routes/generate/" + channelname + "?token=" + token + 
                "&latitude=" + latitude + "&longitude=" + longitude + "&spot_id=" + id + "&radius=" + RADIUS +
                "&minGroupSize=" + minGroupSize + "&maxGroupSize=" + maxGroupSize +
                "&startdate=" + startdate + "&enddate=" + enddate;

            // send a request to the nodeJS API to get an automatically generated route
            // parameters: latitude and longitude, channel name, bearer token, spot ID and a radius
            // returns: a fully generated route
    
            $.ajax({
                type: 'GET',
                crossDomain:true,
                url: url,
                cache: false,
                success: onGetGeneratedRoute,
                error: function(jqXHR, errorstatus, errorthrown) {
                    console.log(errorstatus + ": " + errorthrown);
                }
            }); 
            $("#generate").hide();
            $("#loader").show();
        });
    }
};

/**
* callback function after generating a route 
*/
function onGetGeneratedRoute(data, textStatus, jqXHR) {
    $("#loader").hide();
    if (data.meta.code == 200) {
        selectRoute(data.response.id);
        $("#routeBuilder").hide();
        $("#searchform").hide();
        $("#sortableInput").html("");
        $("#sortable").html("");
        $("#suggestions").html("");
        $("#recommended").html("");
        $("#searchresults").html("");
        $("#tabs").hide();
        $("#groups").hide();
        $("#messages").hide();
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* function that shows/hides the correct divs when generating a route 
*/
function showGenerate() {
    changeView('generate');
};

/**
* add a channel for the patterned generator
*/
function addChannel() {
    if (document.getElementById("channels").getElementsByTagName("li").length < 9) {
        var channelname = $('#channelList_add').find(":selected").val();
        var channelText = $('#channelList_add').find(":selected").html();
        
        $("#channels").append("<li data= '" + channelname + "'>" + channelText + "</li>");
    } else {
        console.log("You can add maximum 9 channels!");
    }
};

/**
* generate a route based on the channel pattern
*/
function addGeneratedChannel(){
    var spot = spots[0];
    var token = $.cookie("token");
    var latitude = spot.meta_info.latitude;
    var longitude = spot.meta_info.longitude;
    var channels = document.getElementById("channels").getElementsByTagName("li");
    var channelString = "";
    var token = $.cookie("token");
    var id = spot.link.params.id;

    var minGroupSize = parseInt($('#minGroupSizeGenerate').val());
    var maxGroupSize = parseInt($('#maxGroupSizeGenerate').val());

    var startdate = $( "#datepicker_from_generate" ).datepicker( "getDate" );
    var enddate = $( "#datepicker_to_generate" ).datepicker( "getDate" );


    if (minGroupSize != null && maxGroupSize != null && minGroupSize > maxGroupSize) {
        console.log("Minimum group cannot be larger than maximum group size!");
    } else {
    
    if (channels.length < 2) {
        console.log("You have to pick at least two channels!");
    } else {
        
        // structure for channel parameter: <channel1>|<channel2>|<channel3>|.....|<channel9>
        channelString = channels.map(function(channel) { return channel.getAttribute('data') }).join('|');

        var url = "http://" + config_serverAddress + "/routes/generate/?channels=" + channelString + "&token=" + token + 
            "&latitude=" + latitude + "&longitude=" + longitude + "&spot_id=" + id + "&radius=" + RADIUS +
            "&minGroupSize=" + minGroupSize + "&maxGroupSize=" + maxGroupSize +
            "&startdate=" + startdate + "&enddate=" + enddate;

        generatedRoute = true;
        
        // send a request to the nodeJS API to get an automatically generated route
        // parameters: latitude and longitude, a list of channels, bearer token, spot ID and a radius
        // returns: a fully generated route
        
        $.ajax({
            type: 'GET',
            crossDomain:true,
            url: url,
            cache: false,
            success: onGetGeneratedRoute,
            error: function(jqXHR, errorstatus, errorthrown) {
               console.log(errorstatus + ": " + errorthrown);
            }
        }); 
        
        $("#generate").hide();
        $("#loader").show();   
    }
    }
};
