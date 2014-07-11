/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * Client-side functionality for displaying routes. 
 *
 */

var current_spot = null;
var current_date = new Date();

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

    current_spot = spotID;

    changeView('routes');

    var url =  config.server.address + "/routes/routesatspot";
    var postdata = {
        spot_id: spotID,
        date: current_date
    };
    $.ajax({
        type: 'POST',
        dataType: "json",
        data: postdata,
        //crossDomain: true,
        //cache: false,
        url: url,
        success: onGetRoutes
        //error: function(jqXHR, errorstatus, errorthrown) {
        //   console.log("Error: " + errorstatus);
        //}
    });
};


/**
* callback function after requesting the routes for a spot
*/
function onGetRoutes(data, textStatus, jqXHR) { 
  $("#routes").html("");

  $( "#current_datepicker" ).datepicker( "setDate", current_date);

  $( "#current_datepicker" ).on("change", function() { 
    current_date = $( "#current_datepicker" ).datepicker( "getDate" );
    showRoute(current_spot); 
  });

  if (data.meta.code == 200) {
    $.each(data.response.routes, addRouteInformation);
  } else {
    alertAPIError(data.meta.message);
  }
};


function addRouteInformation(index, value) {
  function showCompleteGroupsForRoute(route) {
    var html = "<div><label><b>Matching nearby groups: <b></label><ul id='matchingGroups'>";
    
    function renderGroupIfMatches(index, group) {
        var name = group.group.name;
        var minSize = route.minimumGroupSize;
        var maxSize = route.maximumGroupSize;
        var members = group.nearbyMembers;
        var presentMembers = [];
        var missingMembers = [];
        $.each(members, function (index, member) {
            if (member.nearby) {
                presentMembers.push(member);
            } else {
                missingMembers.push(member);
            }
        });

        function getUserProfile(user, callback) {
            var searchdata = { 
                id: user.user,
                token: user.citylife.token
            };
            var url =  config.server.address + "/users/profile";
            $.ajax({
                url: url,
                data: searchdata,
                dataType: "json",
                type: "POST",
                success: function (data, textStatus, jqXHR) {
                  if (data.meta.code == 200) {
                    callback(null, data.response);
                  } else {
                    callback(data.meta.message, null);
                  }
                },
                error: function(jqXHR, errorstatus, errorthrown) {
                    console.log("Error: " + errorstatus + " -- " + jqXHR.responseText);
                }
            });  
        }

        // Group is not too big or too small for the route
        if ((maxSize === null || presentMembers.length <= maxSize) && members.length >= minSize) {
            // Render a group as a complete group for the route
            if (presentMembers.length >= minSize) {
              html = html + "<div><b>Complete: " + name + "</b>";
              async.map(presentMembers, getUserProfile, function (err, profiles) {
                $.each(profiles, function (index, json) {
                  var profile = JSON.parse(json);
                  var thumbnail_url = profile.avatar;
                  if (thumbnail_url === null) {
                    thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
                  }
                  html = html + "<li>" +
                    "<img src='" + thumbnail_url + "' alt='<profile thumbnail>' height=42 width=42>" +
                    "<p style='color:green'>" + profile.first_name + " " + profile.last_name + "</p>" +
                    "</li>";
                });
                html = html + "</div>";
                $("#" + value._id).append(html);
              });
            // Render the group as an incomplete group
            } else {
                html = html + "<li><b> Incomplete: " + name + " " + "(" + (minSize - presentMembers.length) + " more needed)" + "</b></li>";
                // Render the present members
                async.map(presentMembers, getUserProfile, function (err, profiles) {
                  $.each(profiles, function (index, json) {
                    var profile = JSON.parse(json);
                    var thumbnail_url = profile.avatar;
                    if (thumbnail_url === null) {
                      thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
                    }
                    html = html + "<li>" +
                      "<img src='" + thumbnail_url + "' alt='<profile thumbnail>' height=42 width=42>" +
                      "<p style='color:green'>" + profile.first_name + " " + profile.last_name + "</p>" +
                      "</li>";
                  });
                  // Render the missing members
                  async.map(missingMembers, getUserProfile, function (err, profiles) {
                    $.each(profiles, function (index, json) {
                      var profile = JSON.parse(json);
                      var thumbnail_url = profile.avatar;
                      if (thumbnail_url === null) {
                       thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
                      }
                      html = html + "<li>" +
                        "<img src='" + thumbnail_url + "' alt='<profile thumbnail>' height=42 width=42>" +
                        "<p style='color:grey'>" + profile.first_name + " " + profile.last_name + "</p>" +
                        "</li>";
                    });
                    html = html + "</div>";
                    $("#" + value._id).append(html);
                  });
                });
            }
        }
    }

    var spot_id = ((current_spot.split('https://vikingspots.com/citylife/items/'))[1].split("/"))[0];
    var url =  config.server.address + 
      "/spots/usersnearby?spot_id=" + spot_id + 
      "&user_id=" + user.citylife.id +
      "&route_id=" + route._id +
      "&token=" + user.citylife.token;

      // Get all groups and members info and render for each group if it is complete
    $.ajax({
       type: 'GET',
       crossDomain: true,
        url: url,
        cache: false,
        success: function (data, textStatus, jqXHR) { $.each(data.response, renderGroupIfMatches); },
        cache: false,
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
  } 

    var maxParticipants = value.maximumGroupSize;
    if (maxParticipants == null) {
      maxParticipants = "Unlimited";
    }
    // Add all the group info to the route
    var html = " <div class='routeinfo' > " + "<h3>" + value.name + "</h3>" /*+ "<br />"*/ + value.description + 
            "<br />" + "<b>Minimum participants: </b>" + value.minimumGroupSize +
            "<br />" + "<b>Maximum participants: </b>" + maxParticipants +
            "<br />" +  "<div id='" + value._id + "'></div>" + //showCompleteGroupsForRoute(value) +
            "<br /><img onclick=selectRoute('" + value._id + "') src='" + value.png + "' width='150' height= '150'/>";
      
    showCompleteGroupsForRoute(value);
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
    var url =  config.server.address + "/routes/find?id=" + routeID + "&token=" + user.citylife.token;
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
           console.log("Error: " + errorstatus);
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