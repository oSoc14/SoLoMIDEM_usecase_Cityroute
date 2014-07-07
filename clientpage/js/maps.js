/**
* @author: Mathias Raets
* @copyright: OFKN Belgium
* this file contains maps-implementation
*/




var googleMap;
var myMarker;
var taskID;
var nearbySpotOpened = false;
var CHECKIN_DISTANCE_TRESHOLD = 0.250; // the range when a pop-up for a check-in pops up (in km)

var visitedSpots = [];



/**
* Generate a given route and show it on the map
*/
function generateRoute( ) {
    $("#aside").show();
    var numSpots = routeData.spots.length -1;
    var originLat = null;
    var originLong = null;
    var destLat = null;
    var destLong = null;

    if (routeData.spots[0] !== undefined) {
        originLat = routeData.spots[0].point.latitude;
        originLong = routeData.spots[0].point.longitude;
    } else {
        var gis = ((routeData.spots[0].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
        originLat = gis.ycoordinate;
        originLong = gis.xcoordinate;
    }
    if (routeData.spots[numSpots].point !== undefined) {
        destLat = routeData.spots[numSpots].point.latitude;
        destLong = routeData.spots[numSpots].point.longitude;
    } else {
        var gis = ((routeData.spots[numSpots].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
        destLat = gis.ycoordinate;
        destLong = gis.xcoordinate;
    }

    var latLong = new google.maps.LatLng(originLat, originLong);
    var destLatLong = new google.maps.LatLng(destLat, destLong);

    // initialize google variables
    dirService = new google.maps.DirectionsService();
    dirDisplay = new google.maps.DirectionsRenderer({suppressMarkers : true});
    dirDisplay.setMap(googleMap);

    // the waypoints will be stored in this array
    var waypoints = [];

    //iterate over all the spots in the route
    $.each(routeData.spots, function(index, value) {
                        //the first and the last spot are not waypoints!
                        if (index != 0 && index != numSpots) {
                            var coords = null;
                            if (value.point !== undefined) {
                                coords = new google.maps.LatLng(value.point.latitude, value.point.longitude);
                            } else {
                                var gis = ((value.contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
                                coords = new google.maps.LatLng(gis.ycoordinate, gis.xcoordinate);
                            }
                            waypoints.push({location:coords, stopover:true});
                            }
                        });
    var optimize = $("#optimizeSwitch").val() == 1;
    if (generatedRoute)
        optimize = false;
    //console.log(optimize);
    // generate the request
    var dirRequest = {
       origin: latLong,
       destination: destLatLong,
       waypoints: waypoints,
       optimizeWaypoints:optimize,
       travelMode: google.maps.DirectionsTravelMode.WALKING
     };
     generatedRoute = false;

    //generate the route using Google Directions API
    dirService.route(dirRequest, onRouteCalculated );

    navigator.geolocation.getCurrentPosition( function (position) {
            var latLong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var circle = {
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "lightblue",
                  fillOpacity: 0.8,
                  scale: 5,
                  strokeColor: "black",
                  strokeWeight: 1
                };
            var markerOptions =
            {
                position: latLong,
                title:"My Position",
                icon: circle
            }
            myMarker = new google.maps.Marker(markerOptions);
            myMarker.setVisible(true);
            myMarker.setMap(googleMap);

        });
};

/**
* callback function: after the route has been generated
*/
function onRouteCalculated (directionsResult, directionsStatus){

    // imagenames for the markerimages
    var markerArray = ["markerA","markerB","markerC","markerD","markerE","markerF","markerG","markerH","markerI","markerJ","markerK"];
    dirDisplay.setDirections(directionsResult);

    var waypoints = directionsResult.routes[0].waypoint_order;

    for (var i = 0; i < waypoints.length; ++i ){
        var spot = routeData.spots[waypoints[i] + 1];
        var iconString = "http://www.google.com/mapfiles/" + markerArray[i] + ".png";
        addIcon(spot, iconString);
    }

    addIcon(routeData.spots[0],"http://www.google.com/mapfiles/dd-start.png");
    addIcon(routeData.spots[waypoints.length + 1],"http://www.google.com/mapfiles/dd-end.png");

    window.clearInterval(taskID);
    /* Check each 3 seconds for an update of the position */
    taskID = window.setInterval(function(){
            navigator.geolocation.getCurrentPosition( function (position) {
                var latLong = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                myMarker.setPosition(latLong);
                checkSpotsOnRoute(latLong);
            }, function (error) {console.log("Error while acquiring current location");},{enableHighAccuracy:true});
    },3000);

    showRouteMetaInfo(directionsResult.routes[0].waypoint_order);
};


/**
* function that adds a marker with an icon to the map
* @param spot: the spot for which a marker will be added
* @iconString: the location of the icon
*/
function addIcon(spot, iconString) {
    var latitude = null;
    var longitude = null;
    var name = null;
    var description = null;

    if (spot.point !== undefined) {
        latitude = spot.point.latitude;
        longitude = spot.point.longitude;
        name = spot.data.name;
        description = spot.data.description;
    } else {
        var gis = ((spot.contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
        latitude = gis.ycoordinate;
        longitude = gis.xcoordinate;
        var eventdetails = spot.eventdetails.eventdetail[0];
        name = eventdetails.title;
        description = eventdetails.shortdescription;
    }

    var markerOptions =
        {
            position: new google.maps.LatLng(latitude, longitude),
            title: "Location: " + name,
            animation: google.maps.Animation.DROP,
            clickable: true,
            icon: iconString
        }
        var marker = new google.maps.Marker(markerOptions);
        marker.setVisible(true);
        marker.setMap(googleMap);
        var infoWindow = new google.maps.InfoWindow();

        // add a infowindow with the name of the spot
        infoWindow.setContent("<b>Location:</b> " + name + "<br /><b>Description:</b> " + description);

        google.maps.event.addListener(marker, 'click', function() {
            infoWindow.open(googleMap, marker);
        });
};

/**
* Show extra information in the route view
* @param the order of the waypoints
**/
function showRouteMetaInfo(waypoints){
    $("#routeSpots").slideDown();
    $("#routeSpotsMeta").html("<b>Routename:</b> " + routeData.name + "<br /><b>Description:</b><br />" + routeData.description + "<br /><br /><b>Spots: </b>");
    $("#routeSpotsList").html("");

    var startspot = routeData.spots[0];
    var endspot = routeData.spots[waypoints.length + 1];
    var startspot_name = null;
    var endspot_name = null;

    if (startspot.point !== undefined) {
        startspot_name = startspot.data.name;
    } else {
        var eventdetails = startspot.eventdetails.eventdetail[0];
        startspot_name = eventdetails.title;
    }

    if (endspot.point !== undefined) {
        endspot_name = endspot.data.name;
    } else {
        var eventdetails = endspot.eventdetails.eventdetail[0];
        endspot_name = eventdetails.title;
    }

    //add start point
    $("#routeSpotsList").append("<li>" + startspot_name + "</li>");

    // add waypoints
    for (var i = 0; i < waypoints.length; ++i ) {
        var spot = routeData.spots[waypoints[i] + 1];
        var name = null;
        if (spot.point !== undefined) {
            name = spot.data.name;
        } else {
            var eventdetails = spot.eventdetails.eventdetail[0];
            name = eventdetails.title;
        }
        $("#routeSpotsList").append("<li>" + name + "</li>");
    }

    //add last point
    $("#routeSpotsList").append("<li>" + endspot_name + "</li>");
};


/**
* compare your current position with the position of the spots on the route
* @param currentPosition your current position
*/
function checkSpotsOnRoute ( currentPosition ) {
    $.each( routeData.spots, function (index, value) {
        if (value.point !== undefined) {    // TODO: currently just filters out CultuurNet events. Should be able to check in on them.
            var distance = haversine( currentPosition.lat(), value.point.latitude, currentPosition.lng(), value.point.longitude);
            if (!nearbySpotOpened && distance <= CHECKIN_DISTANCE_TRESHOLD) {
                if ( $.inArray( value, visitedSpots ) < 0 ) {
                    showSpotInfo(value);
                    visitedSpots.push(value);
                    nearbySpotOpened = true;
                }
            }
        }
    });
};

/**
* show information about nearby spots
* @param spot the nearby spot
*/
function showSpotInfo (spot) {
    $("#spotInfo").hide();

    var latitude = spot.point.latitude;
    var longitude = spot.point.longitude;

    var url =  "http://" + config_serverAddress + "/spots?latitude=" + latitude + "&longitude=" + longitude + "&token=" + $.base64('btoa', $.cookie("token"), false);

    // send a request to the nodeJS API to get information about nearby spots
    // parameters: latitude and longitude
    // returns: list of nearby spots

    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: function (data, textStatus, jqXHR) {onGetNearbySpotsInfo(data, textStatus, jqXHR, spot);},
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
};

/**
* callback function when acquiring info about nearby spots
* inject a lot of HTML
**/
function onGetNearbySpotsInfo(data, textStatus, jqXHR, spot) {

    function getSpotDataFromChannelItem(item, callback) {
        var url = "http://" + config_serverAddress + "/spots/details?spot_id=" + item.item_id + "&token=" + $.cookie("token");

        $.ajax({
            type: 'GET',
            crossDomain:true,
            url: url,
            cache: false,
            success: function(spot, textStatus, jqXHR) {
                callback(spot);
            },
            error: function(jqXHR, errorstatus, errorthrown) {
                console.log(errorstatus + ": " + errorthrown);
            }
        });
    }

    if (data.meta.code == 200) {
        getSpotDataFromChannelItem(spot, function (details_response) {
            var s = details_response.response;
            var image = s.web_image;
            if (image === null || image.length == 0) {
              image = "http://www.viamusica.com/images/icon_location02.gif";
            }
            $("#spotInfo").html("<b> Spot: </b> " + spot.data.name + "</br> <b>Description:</b>" + spot.data.description +
                "<br /> <img src ='" + image +  "' width = '200' height='200'/>");
            $("#spotInfo").append("<input type='button' value='Check in here' onclick=checkinAtNearSpot('" + spot.url + "') /><input type='button' value='Close' onclick= $('#spotInfo').slideUp();nearbySpotOpened = false; />");
             $("#spotInfo").append("<div onclick=$('#nearbyList').slideToggle()> Show/Hide nearby spots </div>");

            $("#spotInfo").append("<div  id = 'nearbyList' class='nearbySpots';/>");

            $.each(data.response, function (index, item) {
                var id = item.item;
                if (id != spot.id)
                    $("#nearbyList").append("<div>" + item.discover_card_data.title + "<br/><img width='150' height='150' src='" + item.mapspng + "'</div>");
            });

            $('#nearbyList').hide();
            $("#spotInfo").slideDown();
        });
    } else {
        alertAPIError(data.meta.message);
    }
};

/**
* check in at a spot on your current route
* @param spotID the spot where you want to check in at
*/
function checkinAtNearSpot (spotID) {
    var url =  "http://" + config_serverAddress + "/spots/checkin?spot_id=" + spotID + "&token=" + $.cookie("token");

    // send a request to the nodeJS API to check in at a spot
    // parameters: bearer token, spotID
    // returns: confirmation of your checkin, spot ID

    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onCheckedInAtNearSpot,
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
};

/**
* callback function after check in
*/
function onCheckedInAtNearSpot ( data, textStatus, jqXHR ) {
    alert ("You are checked in!");
    $('#spotInfo').slideUp();
    nearbySpotOpened = false;
};


/**
* show the route on a google maps view
*/
function showGoogleMaps(){
   loadMaps();
};


/**
* callback function after loading a map
*/
function onMapsLoaded() {
    var mapOptions = {
          center: new google.maps.LatLng(-34.397, 150.644),
          zoom: 8,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    googleMap = new google.maps.Map(document.getElementById("map-canvas"),mapOptions);

    generateRoute();
};

/**
* a function to calculate the distance between points based on lat/long coordinates
* @param latA latitude of the first point
* @param longA longitude of the first point
* @param latB latitude of the second point
* @param longB longitude of the second point
* @return the distante in m between the two points
*/
function haversine(latA, latB, lonA, lonB){
    var R = 6371; // km
    var dLat = toRad(latB-latA);
    var dLon = toRad(lonB-lonA);
    var latA = toRad(latA);
    var latB = toRad(latB);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(latA) * Math.cos(latB);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d ;
};

/**
* convert degrees to Radians
* @param value input degrees to be converted
* @return the value in tadians
*/
function toRad(value) {
    /** Converts numeric degrees to radians */
    return value * Math.PI / 180;
};

/**
* load google maps
*/
function loadMaps() {
  google.load("maps", "3", {"callback" : onMapsLoaded,"other_params" :"key=" + googleKey + "&sensor=true"});
};
