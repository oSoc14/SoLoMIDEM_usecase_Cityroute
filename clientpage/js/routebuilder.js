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

/**
 * show the routebuilder using the spots[] variable
 */
function showRouteBuilder()  {
  var spot = spots[0];
  var latitude = spot.point.latitude;
  var longitude = spot.point.longitude;
  //acquireRecommendedSpots(spots[0].link.params.id);
  suggestSpotsByLatLong(latitude, longitude);

  $.each(spots, function (index, spot) {
    var id = spot.id;
    var toAdd = "<li id='spot_" + id + "' class='ui-state-default'>" + spot.data.name + "</li>";
    $("#sortable").append(toAdd);
    $("#spot_" + id).data('latlong',{latitude: latitude, longitude: longitude});
  });
    
  $("#datepicker_from, #datepicker_to").change(function () {
    var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
    var latlong = $("#" + sortItems[sortItems.length - 1].id).data("latlong");
    var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
    var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
    acquireCultuurnetEventsByLatLong(latlong.latitude, latlong.longitude, startdate, enddate);
  });
};

/**
 * sets a spot as startspot
 * @param spotID the ID of the first spot
 */
function routeBuilderSetFirstSpot(spotID) {
  var startSpot;
  $.each(spots, function(index,value) {
    if (value.url == spotID) {
      startSpot = value;
    }
  });
  spots = [startSpot];
};

/**
 * remove an item when building a list
 * @param the DOM id of the item to be removed
 */
function deleteItem(itemID){
  var lastItem = $('#sortable > li').last();
  $('#' + itemID).remove();
    
  // last item is removed, suggest new spots for new last item
  if (itemID == lastItem.attr('id')) {
    var newLastItem = $('#sortable > li').last();
    var latlong = newLastItem.data('latlong');
    if (latlong) {
      suggestSpotsByLatLong(latlong.latitude, latlong.longitude);
    }
  }
};

/**
 * Add a spot for the routeBuilder
 */
function routeBuilderAddSpot(spot) {
  function getChannelItemFromChannelEntry(entry, callback) {
    var url = entry.item;
    $.ajax({
      type: 'GET',
      crossDomain:true,
      url: url,
      cache: false,
      dataType:"json",
      beforeSend: function(xhr) { 
        xhr.setRequestHeader("Authorization", "Bearer " + user.citylife.token); 
      },
      success: function(spot, textStatus, jqXHR) {
        callback(spot);
      },
      error: function(jqXHR, errorstatus, errorthrown) {
        console.log(errorstatus + ": " + errorthrown);
      }
    });  
  }

  getChannelItemFromChannelEntry(spot, function (s) {
    spots.push(s);
  });
};

/**
 * Clear the routebuilder spots
 */
function routeBuilderClearSpots() {
  spots.length = 0;
  $("#sortable").html("");
};

/**
 * Add a new route to the database
 */
function addNewRoute() {
  var minGroupSize = parseInt($("#minGroupSize").val());
  var maxGroupSize = parseInt($("#maxGroupSize").val());
  var startdate = $("#datepicker_from").datepicker( "getDate" );
  var enddate = $("#datepicker_to").datepicker( "getDate" );
  if (minGroupSize != null && maxGroupSize != null && minGroupSize > maxGroupSize) {
    console.log("Minimum group cannot be larger than maximum group size!");
  } else {
    var items = $('#sortable li').slice(0, 10); // API allows max. 8 waypoints
    var points = [];
    $.each(items, function (index, value) {
      var idParts = value.id.split('_');
      var type = idParts[0];
      var id = idParts[1];
      switch (type) {
        case 'event':
          points.push({
            'event': "http://search.uitdatabank.be/search/rest/detail/event/" + id
          });
          break;
        case 'spot':
          // We have a CityLife spot
          points.push({
            'item': "https://vikingspots.com/citylife/items/" + id + "/"
          }); 
          break;
        case 'station':
          points.push({
            'station': 'TODO-irail-url' + id
          });
          break;
      }                             
    });
   
    console.log(points);

    var newRoute = {
      name: $("#routeName").val(),
      description: $("#routeDescription").val(),
      points: points,
      minimumGroupSize: minGroupSize, 
      maximumGroupSize: maxGroupSize,
      startDate: startdate,
      endDate: enddate,
      token: user.citylife.token
    };
    var url =  config.server.address + "/routes/";
    
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
 * callback function after adding a route
 */
function onRouteAdded(data, textStatus, jqXHR) {
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
  } else {
    console.log('onRouteAdded code' + data.meta.code);
    alertAPIError(data.meta.message);
  }
};

function suggestSpotsByLatLong(latitude, longitude) {
  var startdate = $( "#datepicker_from" ).datepicker( "getDate" );
  var enddate = $( "#datepicker_to" ).datepicker( "getDate" );
  acquireSuggestedSpotsByLatLong(latitude, longitude);
  acquireCultuurnetEventsByLatLong(latitude, longitude, startdate, enddate);
  acquireIrailStationsByLatLong(latitude, longitude);
}

function getSpotIdFromURL(url) {
  return (url.split("https://vikingspots.com/citylife/items/")[1]).split("/")[0];
}

// SUGGESTED SPOTS
// -----------------------------------------------------------

/**
 * find relevant matches for a location using the citylife API
 * @param spot the spot you want to find relevant matches for
 */
function acquireSuggestedSpots(spot) {
  var latitude = spot.point.latitude;
  var longitude = spot.point.longitude;
  acquireSuggestedSpotsByLatLong(latitude, longitude);    
};

/**
 * find relevant matches for a location
 * @param latitude the latitude of the location
 * @param longitude the longitude of the location
 */
function acquireSuggestedSpotsByLatLong( latitude, longitude){
  var url =  config.server.address + "/spots/?token="
          + user.citylife.token
          + "&latitude=" + latitude + "&longitude=" + longitude;
   
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
      console.log(errorstatus + ": " + errorthrown);
    }
  });  
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
      var earn_deals = value.offers.results;
      var spend_deals = value.spend_offers.results;

      var dealsHtml;
      if ((earn_deals.count + spend_deals.count) == 0) {
        dealsHtml = "<div>No deals at this spot</div>";
      } else {
        // create a link with a popover with the deals of the spot
        var earn_deals = value.offers.results;
        var spend_deals = value.spend_offers.results;
        var deal_amount = value.offers.count + value.spend_offers.count;
        
        var popupDeals = '';
        popupDeals += earn_deals.map(function(deal) {
          var description = (deal.description) ? deal.description + '<br>' : '';
          return '<li>'
               +    '<strong>Earn:</strong>'
               +    '<strong>' + deal.title + '</strong>'
               +    description
               + '</li>'
        }).join('');
        
        popupDeals += spend_deals.map(function(deal) {
          var description = (deal.description) ? deal.description + '<br>' : '';
          return '<li>'
               +   '<strong>Spend: </strong>'
               +   '<strong>' + deal.title + '</strong>' + description + '<br>'
               +   'Cost: ' + deal.city_coins + ' fonskes<br>'
               + '</li>';
        }).join('');
                
        var deals_postfix = (deal_amount < 2) ? " deal" :  " deals";
        dealsHtml = '<a id="open_deals_dialog_' + id + '" class="popover-dismiss" ' 
                  +  'data-toggle="popover" data-html="true" data-placement="bottom"'
                  +  'data-content="<ul style=\'padding:0;list-style:none\'>' + popupDeals + '</ul>" '
                  +  'title="Deals ' + value.detail_data.title + '">'
                  +    deal_amount + deals_postfix
                  + '</a>';
      }

      $("#suggestions").append(
        "<li class='list-group-item' id='suggestedSpot_" + id + "'>" 
        + '<p>' 
        +   '<button type="button" class="btn btn-default" onclick="addSuggestedSpot(' + index + ')">' 
        +     '<span class="glyphicon glyphicon-plus"></span>'
        +   '</button>'
        +   value.detail_data.title
        + '</p>' 
        + '<p>' 
        +   '<img src="' + image + '" alt="<spot image>">'
        + '</p>'
        + '<p>' 
        +     dealsHtml
        + '</p>' 
      + '</li>'
      );

      // add latlong data to the DOM elements (prevent requesting the spotinfo again)
      $("#suggestedSpot_" + id).data('latlong', {
        latitude: value.point.latitude,
        longitude: value.point.longitude
      });

      // enable deals popover
      $("[data-toggle=popover]").popover();
      $('.popover-dismiss').popover({
        trigger: 'focus'
      });
    });
  } else {
    alertAPIError(data.meta.message);
  }
};

/**
 * add a suggested spot as next stop in the route
 * @param the position in the list of suggested spots
 */
function addSuggestedSpot(listID) {
  var listitems = document.getElementById("suggestions").getElementsByTagName("li");  
  var sortItems = document.getElementById("sortable").getElementsByTagName("li");  
   
  if (sortItems.length >= 10) {
    console.log("The current API allows maximum 8 intermediate points.");
  } else {
    var spot = listitems[listID];
    var spotID = spot.id.split('_')[1] ;
    var spotName = spot.innerHTML;
    var latlong = $("#" + spot.id).data("latlong");
    
    $("#sortable").append(
      '<li id="spot_' + spotID + '" class="ui-state-default">'
      + spotName 
      + '<span onclick="deleteItem(\'spot_' + spotID + '\')";>delete</span>'
    + '</li>'
    );
    $("#spot_" + spotID).data('latlong', latlong);
    $("#spot_" + spotID).find('button').hide();
    //acquireRecommendedSpots(spotID);
    suggestSpotsByLatLong(latlong.latitude, latlong.longitude);
  }
};

// SEARCH SPOT
// -----------------------------------------------------------

function search(){
  var searchTerm = $("#searchTerm").val();
  navigator.geolocation.getCurrentPosition(function (position) {
    acquireSuggestedSpotsBySearch(position.coords.latitude, position.coords.longitude, searchTerm);
  });
};

/**
 * find relevant spots for a location and a search term
 * @param latitude he latitude of the location
 * @param longitude the longitude of the location
 * @param searchTerm the search term
 */
function acquireSuggestedSpotsBySearch(latitude, longitude, searchTerm) {
  var url = config.server.address + "/spots/search/?token=" 
          + user.citylife.token
          + "&latitude=" + latitude + "&longitude=" + longitude + "&search_term=" + searchTerm;
    
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
      console.log(errorstatus + ": " + errorthrown);
    }
  });
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
      $("#searchresults").append(
        "<li onclick='addSearchedSpot(" + index + ")' id='searchedSpot_" + id + "'>"
        + "<span class='ui-icon ui-icon-plus'></span> " + value.detail_data.title + "<br/>"
        + value.detail_data.description
      + "</li>"
      );
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
    console.log("The current API allows maximum 8 intermediate points.");
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
  var url = config.server.address + "/spots/findbyid?id=" + spotID + "&token=" + user.citylife.token;
    
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
      console.log(errorstatus + ": " + errorthrown);
    }
  });     
};

/**
 * callback function after getting information about a spot
 * now the lat long is known, the relevant spot can be found
 */
function onGetRelevantSpotsFromSearch(data, textStatus, jqXHR) {
  data = JSON.parse(data);
  if (data.meta.code == 200) {
    var latitude = data.response.point.latitude;
    var longitude = data.response.point.longitude;
    suggestSpotsByLatLong(latitude, longitude);
  } else {
    alertAPIError(data.meta.message);
  }
};

// CULTUURNET EVENTS
// -----------------------------------------------------------

/**
 * Get Cultuurenet Events based on the specified coordinates and the start and enddate.
 * @param latitude Latitutude of the location.
 * @param longitude Longitude of the location.
 * @param startdate Start date of the period to get events.
 * @param enddate End date of the perdio to get events.
 */
function acquireCultuurnetEventsByLatLong(latitude, longitude, startdate, enddate) {
  var url = config.server.address + "/cultuurnet/events";

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

/**
 * Callback function after getting the Cultuurnet events.
 * Adds the events to the sidebar in the Events tab.
 */
function onGetCultuurnetEvents(data, textStatus, jqXHR) {
  if (data.meta.code == 200) {
    var events_with_duplicates = data.response.rootObject;
    var events = [];
    var previous_id = '';
    for (var i = 1; i < events_with_duplicates.length; i++) {
      var event = (events_with_duplicates[i]).event;
      if (previous_id != event.cdbid) {
        events.push(event);
        previous_id = event.cdbid;
      }
    }

    $("#events").html("");
    $("#tabs-2-loader").hide();
    events.forEach(function(event, index) {
      var id = event.cdbid;
      var eventdetails = (event.eventdetails.eventdetail)[0];
      var calendar_summary = eventdetails.calendarsummary;
      var title = eventdetails.title;
      var description = eventdetails.shortdescription;
      
      $("#events").append(
        '<li class="list-group-item" id="suggestedEvent_' + id + '">'
        + '<button type="button" class="btn btn-default" onclick="addEvent(' + index + ')"' 
        +         'style="margin-right:10px">' 
        +   '<span class="glyphicon glyphicon-plus"></span>'
        + '</button>'
        + '<strong>' + title + '</strong><br/>'
        + description + '<br/>'
        + '<strong>Calendar: </strong>' + calendar_summary 
      + '</li>'
      );
      
      var gis = ((event.contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
      $("#suggestedEvent_" + id).data('latlong', {
        latitude: gis.ycoordinate,
        longitude: gis.xcoordinate
      });
    });
    //};
  } else {
    alertAPIError(data.meta.message);
  }
}

/**
 * Add the selected Cultuurnet event to the current route.
 */
function addEvent(listID) {
  var listitems = document.getElementById("events").getElementsByTagName("li");  
  var sortItems = document.getElementById("sortable").getElementsByTagName("li");

  if (sortItems.length >= 10) {
    console.log("The current API allows maximum 8 intermediate points.");
  } else {
    var elementId = listitems[listID].id;
    var eventID = elementId.split('_')[1] ;
    var eventName = listitems[listID].innerHTML;
    var latlong = $("#" + elementId).data("latlong");
    
    $("#sortable").append(
        '<li id="event_' + eventID + '" class="ui-state-default">'
        + 'Event: ' + eventName
        + '<span onclick="deleteItem(\'event_' + eventID + '\');">delete</span>'
      + '</li>'
    );
    $("#event_" + eventID).data('latlong', latlong);
    $("#event_" + eventID).find('button').hide();
     
    suggestSpotsByLatLong(latlong.latitude, latlong.longitude);
  }
}

// IRAIL STATIONS
// -----------------------------------------------------------

function acquireIrailStationsByLatLong(latitude, longitude) {
  var url = config.server.address + '/irail/stations';
  $('#tabs-4-loader').show();

  $.ajax({
    url: url,
    data: {
      'latitude': latitude,
      'longitude': longitude,
    },
    success: onGetIrailStations,
    dataType: 'json',
    type: 'POST'
  });
};

function onGetIrailStations(data, textStatus, jqXHR) {
  if (data.meta.code == 200) {
    $('#tabs-4-loader').hide();
    $("#stations").html("");

    var stations = data.response;
    $.each(stations, function(index, station) {
      var id = 'suggestedStation_' + station.id;

      
      var checkedin = station.checkedin ? 
        '<br><span class="glyphicon glyphicon-map-marker"></span> Checked In' : '';

      $('#stations').append(
        '<li class="station list-group-item" id="' + id + '">'
          + '<span class="badge">' + station.distance.toFixed(2) + ' km</span>'
          + '<p>'
          +   '<button type="button" class="btn btn-default" onclick="addStation(' + index + ')"' 
          +           'style="margin-right:10px">' 
          +     '<span class="glyphicon glyphicon-plus"></span>'
          +   '</button>'
          +   '<strong>' + station.name + '</strong> (<a href="' + station.uri + '">Liveboard</a>)'
          +   checkedin
          + '</p>'
        + '</li>'
      );
      
      $.data(document.getElementById(id), 'latlong', {
        latitude: station.latitude,
        longitude: station.longitude
      });

    });
  } else {
    alertAPIError(data.meta.message);
  }
}

function addStation(listID) {
  var stations = $("#stations > li");
  var addedSpots = $("#sortable > li");

  if (addedSpots.length >= 10) {
    console.log('The current API allows maximum 8 intermediate points.');
  } else {
    var station = stations[listID]; 
    var stationID = station.id.split('_')[1];
    //var latlong = $('#' + station.id).data('latlong');
    var latlong = $.data(document.getElementById(station.id), 'latlong');

    $('#sortable').append(
      '<li id="station_' + stationID + '" class="ui-state-default">Station: ' + station.innerHTML
      + '<span onclick="deleteItem(\'station_' + stationID +'\');">delete</span></li>'
    );
    var element = document.getElementById('station_' + stationID);
    $.data(element, 'latlong', latlong);
    $(element).find('button').hide();

    suggestSpotsByLatLong(latlong.latitude, latlong.longitude);
  }
}

// RECOMMENDED SPOTS
// -----------------------------------------------------------

// not functional Whats Next API does not exists in CityRoute / SoLoMIDEM

/**
* Get a recommended spot based on the VikingPatterns API
* @param the spot ID
*/
function acquireRecommendedSpots(spotID) {
  if(!config.whatsnext) return;
  var url = config.whatsnext.address + user.citylife.token + "/whatsnext/" +spotID + "/";
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
      console.log("The what's next API is having some problems");
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
        $("#recommended").append(
          "<li onclick='addRecommendedSpot(" + index + ")' id='recommendedSpot_" + value.id + "'>" +
          "<span class='ui-icon ui-icon-plus'></span> " + value.name
        );

        $("#recommendedSpot_" + value.id).append("</li>");

        // add latlong data to the DOM elements (prevent requesting the spotinfo again)
        $("#recommendedSpot_" + value.id).data('latlong',{
          latitude: value.latitude,
          longitude: value.longitude
        });
      });
    }
    else {
      $("#recommended").html("There are no recommended spots for this spot.");
    }
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
    console.log("The current API allows maximum 8 intermediate points.");
  } else {
    var spotID = listitems[listID].id.split('_')[1] ;
    var spotName = listitems[listID].innerHTML;
    var toAdd = "<li id='spot_" + spotID + "' class='ui-state-default'>" + spotName + "<span onclick=deleteItem('spot_" + spotID + "');>delete</span></li>";
    $("#sortable").append(toAdd);
    var latlong = $("#" + listitems[listID].id).data("latlong");
    $("#spot_" + spotID).data('latlong',{
      latitude: latlong.latitude,
      longitude: latlong.longitude
    });
    //acquireRecommendedSpots(spotID);
    suggestSpotsByLatLong(latlong.latitude, latlong.longitude);
  } 
};
