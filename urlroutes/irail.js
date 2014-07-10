/*
 * Get spots from the iRail API
 */
var utils = require('../utils');
var radius = 10; // radius of the area around the location to look for stations

/**
 * Get stations located in a radius of the passed coordinates.
 */
exports.getStationsInRadius = function(req, res) {
  var latitude = parseFloat(req.body.latitude);
  var longitude = parseFloat(req.body.longitude);

  getStationsRemote(latitude, longitude, function(result) {
    res.send(result);
  });
}

/**
 * Get all the stations in a radius around the specified coordinates from the 
 * iRail API and pass the stations to the specified callback function.
 */
function getStationsRemote(latitude, longitude, callback) {
  var request = require('request');
  var uri = 'https://irail.be/stations/NMBS';

  request({
    uri: uri,
    method: 'GET',
    headers: { 'Accept': 'application/json'}
  }, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback({
        'meta': utils.createErrorMeta(500, 'X_001', 'Something went wrong with the iRail API' + error),
        'response': {}
      });
    } else {
      var stations = JSON.parse(body)['@graph'];
      return callback({
        'meta': utils.createOKMeta(),
        'response': filterStationsToRadius(stations, latitude, longitude)
      });
    }
  });
}

/**
 * Get all the stations in a radius around the specified coordinates from a local 
 * JSON file and pass the stations to the specified callback function.
 */
function getStationsLocal(latitude, longitude, callback) {
  try {
    var fileJSON = require('../stations-new.json');
    var stations = fileJSON['@graph'];
    return callback({
      'meta': utils.createOKMeta(),
      'response': filterStationsToRadius(stations, latitude, longitude)
    });
  }
  catch(error) {
    return callback({
      'meta': utils.createErrorMeta(500, 'X_001', 'Something went wrong with reading the station json file' + error),
      'response': {}
    });
  }
}

/**
 * Filter the specified arry of stations to the stations within the area determined 
 * by theradius around the specified coordinates and sort them by distance ascendingly.
 */
function filterStationsToRadius(stations, latitude, longitude) {
  return stations.map(function(station) {
    station.id = station["@id"].split("/").pop();
    station.uri = station["@id"];
    station.distance = haversine(
      latitude, longitude,
      parseFloat(station.latitude), parseFloat(station.longitude)
    );
    return station;
  }).filter(function(station) {
    return station.distance < radius;
  }).sort(function(s1, s2) {
    return s1.distance - s2.distance;
  });
}

/**
 * An algorithm to calculate the distance between points based on lat/long coordinates
 * @param latA latitude of the first point
 * @param longA longitude of the first point
 * @param latB latitude of the second point
 * @param longB longitude of the second point
 * @return the distante in m between the two points
 */
function haversine(latA, lonA, latB, lonB){
  var R = 6371; // km
  var dLat = toRad(latB-latA);
  var dLon = toRad(lonB-lonA);
  var latA = toRad(latA);
  var latB = toRad(latB);

  var a = Math.pow(Math.sin(dLat/2), 2) + Math.pow(Math.sin(dLon/2), 2) * Math.cos(latA) * Math.cos(latB);
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
  return value * Math.PI / 180;
};

