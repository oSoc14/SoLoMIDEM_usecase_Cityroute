/**
* @author: Mathias Raets
* @copyright: OFKN be
* This file provides route functionality
*/

/**
* show a list of possible routes for a given spot ID
* @param spotID: the ID of the spot
*/
function showRoute ( spotID ){
   /** 
   * send a request to the nodeJS API to acquire the nearby spots
   * parameters: latitude and longitude
   * returns: list of spots
   */
   $("#spotList").hide();
   $("#spotListTable").html("");
   
   $("#routes").show();
   $("#aside").hide();
    var url =  "http://" + config_serverAddress + "/routes/?spot_id=" + spotID;
    $.ajax({
        type: 'GET',
        crossDomain:true,
        cache: false,
        url: url,
        success: onGetRoutes,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus);
        }
    });
};

/**
* callback function after requesting the routes for a spot
*/
function onGetRoutes(data, textStatus, jqXHR) { 
    $("#routes").html("");
    // for each route
    $("#routes").append("<div style='float:left;' ><input style='margin-right:50px;' type='button' value='Add new route' onclick='showRouteBuilder()'/> "  + 
        " Optimize Waypoints: <select id='optimizeSwitch'><option value='1'>On</option><option value='0'>Off</option></select></div>");
        $('#optimizeSwitch').switchify();
    $("#routes").append("<br><p>View for date: <input type='text' id='current_datepicker' /></p><br>");
    $( "#current_datepicker" ).datepicker();
    if (data.meta.code == 200) {
        $.each(data.response.routes, addRouteInformation);
    } else {
        alertAPIError(data.meta.message);
    }
};

function addRouteInformation(index, value) {
  function showCompleteGroupsForRoute(route) {
    // TODO: Create a list of groups of which enough members are nearby to participate in the route.
    // find nearby members of groups where user is member of as well
    // If enough members to participate are nearby, add this group to the list of groups
    var groups = [];
    var html = "<div><label><b>Matching nearby groups: <b></label><ul id='matchingGroups'></ul></div>";
    // TODO: append group list items
    return html;
  } 

    var maxParticipants = value.maximumGroupSize;
    if (maxParticipants == null) {
      maxParticipants = "Unlimited";
    }
    var html = " <div class='routeinfo' > " + "<h3>" + value.name + "</h3>" /*+ "<br />"*/ + value.description + 
            "<br />" + "<b>Minimum participants: </b>" + value.minimumGroupSize +
            "<br />" + "<b>Maximum participants: </b>" + maxParticipants +
            "<br />" + showCompleteGroupsForRoute(value) +
            "<br /><img onclick=selectRoute('" + value._id + "') src='" + value.png + "' width='150' height= '150'/>";
      
    $("#routes").append(html);
};

/**
* requests all the information for a given route
* @param routeID the id for the route
*/
function selectRoute(routeID) {
   /**
   * send a request to the nodeJS API to acquire the nearby spots
   * parameters: latitude and longitude
   * returns: list of spots
   */
   
    var url =  "http://" + config_serverAddress + "/routes/" + routeID;
    $("#routes").hide();
    $("#map-canvas").show();
    $("#map-canvas").height(300);
    
    // send a request to the nodeJS API to get an selected route
    // parameters: route ID
    // returns: a route with all the spots    
    
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        cache: false,
        success: onGetRouteByID,
        cache: false,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus);
        }
    });
};

/**
* Callback function after receiving route information
*/
function onGetRouteByID(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        showGoogleMaps();
        routeData = data.response;
    } else {
        alertAPIError(data.meta.message);
    }
};