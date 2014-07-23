/*
 * Get spots from the iRail API
 */
require('array.prototype.find');
var utils = require('../utils');
var radius = 10; // radius of the area around the location to look for stations

function getAllStationsLocal(callback) {
  try {
    var fileJSON = require('../stations-new.json');
    var stations = fileJSON['@graph'];
    return callback(null, stations);
  }
  catch(error) {
    return callback(error, null);
  }
}

function getAllStationsRemote(callback) {
  var request = require('request');
  var uri = 'https://irail.be/stations/NMBS';

  request({
    uri: uri,
    method: 'GET',
    headers: { 'Accept': 'application/json'}
  }, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback(error, null);
    } else {
      var stations = JSON.parse(body)['@graph'];
      return callback(null, stations);
    }
  });
}

/**
 * Get stations located in a radius of the passed coordinates.
 */
exports.getStationsInRadius = function(req, res) {
  var latitude = parseFloat(req.body.latitude);
  var longitude = parseFloat(req.body.longitude);
  var token = req.body.token;

  getStationsInArea(latitude, longitude, token, function(result) {
    res.send(result);
  });
}

/**
 * Get all the stations in a radius around the specified coordinates from the 
 * iRail API and pass the stations to the specified callback function.
 */
function getStationsInArea(latitude, longitude, token, callback) {
  //getAllStationsRemote(function(error, stations) {
  getAllStationsLocal(function(error, allStations) {
    if (error) {
      return callback({
        'meta': utils.createErrorMeta(500, 'X_001',
            'Something went wrong with the iRail API' + error),
        'response': {}
      });
    } else {
      // 5 closest stations
      var suggestedStations = filterStationsToRadius(allStations, latitude, longitude).slice(0, 5);
      getStationsFromCheckins(token, allStations, function(error, stationsCheckedIn) {
        if (! error) {
          // remove checkedin stations who are already in suggested stations
          var checkinsNotInArea = stationsCheckedIn.filter(function(checkinStation) {
            return ! suggestedStations.find(function(suggStation) {
              return suggStation['@id'] == checkinStation['@id'];
            });
          });
          // add stations checked in to suggested stations
          Array.prototype.push.apply(suggestedStations, checkinsNotInArea);
        }
        return callback({
          'meta': utils.createOKMeta(),
          'response': suggestedStations
        });
      });
    }
  });
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

exports.getStationsCheckedIn = function(req, res) {
  var irailToken = '';//req.body.token;

  getAllStationsLocal(function(error, allStations) {
    getStationsFromCheckins(irailToken, allStations, function(error, stationsCheckedIn) {
      if (error) {
        return res.send({
          'meta': utils.createErrorMeta(500, 'X_001', 
              'Something went wrong with the iRail API' + error),
          'response': {}
        });
      } else {
        return res.send({
          'meta': utils.createOKMeta(),
          'response': stationsCheckedIn
        });
      }
    });
  });
}

function getStationsFromCheckins(token, allStations, callback) {
  try {  
    var async = require('../lib/async-master/lib/async');

    if (! token) {
      return callback(null, []);
    }

    //getCheckInsRemote(token, function(error, checkins) {
    getCheckInsLocal(function(error, checkins) {
      if (error) {
        throw error;
      }

      var uniqueDepartureIds = checkins.map(function(userDep) {
        return userDep.departure;
      }).filter(function(element, position, duplicateDepartureIds) {
        return duplicateDepartureIds.indexOf(element) == position;
      }); // remove dupplicates

      async.map(
        uniqueDepartureIds,
        function(departure, singleDepartureCallback) {
          getStartStationIdFromDeparture(departure, singleDepartureCallback);
        },
        function (error, stationIds) {
          if (error) {
            throw error;
          } else {
            var stationsCheckedIn = stationIds.map(function(id) {
              var station = allStations.find(function(station) {
                return station['@id'] == id;
              });
              station.checkedin = true;
              return station;
            });
            callback(null, stationsCheckedIn);
          }
        }
      );
    });
  } catch(error) {
    return callback(error, null);
  }
}

function getCheckInsLocal(callback) {
  try {
    var fileJSON = require('../checkins.json');
    var checkins = fileJSON['users'];
    return callback(null, checkins);
  }
  catch(error) {
    return callback(error, null);
  }
}

function getCheckInsRemote(token, callback) {
  var request = require('request');
  var uri = 'https://78.23.228.130:9999/checkins?access_token=' + token;
  
  request({
    uri: uri,
    method: 'GET',
    headers: { 'Accept': 'application/json'}
  }, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback(error, null);
    } else {
      var checkins = JSON.parse(body)['users'];
      return callback(null, checkins);
    }
  });
}

function getStartStationIdFromDeparture(departureUrl, callback) {
  var request = require('request');

  request({
    uri: departureUrl,
    method: 'GET',
    headers: { 'Accept': 'application/json'}
  }, function(error, response, body) {
    if (error || response.statusCode !== 200) {
      return callback(error, null);
    } else {
      var startStation = JSON.parse(body)['@graph'].stop;
      return callback(null, startStation); 
    }
  });
}
