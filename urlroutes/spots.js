/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Implementation of spots API
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * TODO: add iRail public transport spots and CultuurNet events
 *
 */

function getChannelEntryFromDiscoverItem(item, auth_token, callback) {
    var requestlib = require('request');

    requestlib({
        uri: item.entry_url,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': "Bearer " + auth_token
        }
    }, function (error, responselib, body) {
        if (error || responselib.statusCode != 200) {
            callback(error, null);
        } else {
            var offers_url = "https://vikingspots.com/citylife/offers/";
            var spend_offers_url = "https://vikingspots.com/citylife/spend-offers/";
            var entry = JSON.parse(body);
            var entry_id = (((entry.item).split('https://vikingspots.com/citylife/items/'))[1].split("/"))[0];

            requestlib({
                uri: offers_url + "?item_id=" + entry_id + "&state=live",
                method: "GET",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Authorization': "Bearer " + auth_token
                }
            }, function (error, responselib, offers) {
                if (error || responselib.statusCode != 200) {
                    callback(error, null);
                } else {
                    entry.offers = JSON.parse(offers);
                    requestlib({
                        uri: spend_offers_url + "?item_id=" + entry_id + "&state=live",
                        method: "GET",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                            'Authorization': "Bearer " + auth_token
                        }
                    }, function (error, responselib, spend_offers) {
                        if (error || responselib.statusCode != 200) {
                            callback(error, null);
                        } else {
                            entry.spend_offers = JSON.parse(spend_offers);
                            callback(null, entry);
                        }
                    });
                }
            });
        }
    });
}

function getSpotFromChannelEntry(channel_entry, auth_token, callback) {
    var requestlib = require('request');

    requestlib({
        uri: channel_entry.item,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': "Bearer " + auth_token
        }
    }, function (error, responselib, body) {
        if (error || responselib.statusCode != 200) {
            callback(error, null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
}

function getSpotFromCheckIn(checkin, auth_token, callback) {
    var requestlib = require('request');
    requestlib({
        uri: checkin.item,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': "Bearer " + auth_token
        }
    }, function (error, responselib, body) {
        if (error || responselib.statusCode != 200) {
            callback(error, null);
        } else {
            callback(null, JSON.parse(body));
        }
    });
}

function getSpotFromDiscoveryItem(item, auth_token, callback) {
    getChannelEntryFromDiscoverItem(item, auth_token, function(err, channel_entry) {
        if (err) {
            callback(err, null);
        } else {
            getSpotFromChannelEntry(channel_entry, auth_token, callback);
        }
    });
}



function getSpotsFromChannelEntries(entries, auth_token, callback) {
    var async = require('../lib/async-master/lib/async');

    function to_map(item, single_item_callback) {
        getSpotFromChannelEntry(item, auth_token, single_item_callback);
    }

    async.map(entries, to_map, function (err, spots) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, spots);
        }
    });
}


function getSpotsFromDiscoverItems(items, auth_token, callback) {
    var async = require('../lib/async-master/lib/async');

    function to_map(item, single_item_callback) {
        getSpotFromDiscoverItem(item, auth_token, single_item_callback);
    }

    async.map(items, to_map, function (err, spots) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, spots);
        }
    });
}


function getChannelEntriesFromDiscoverItems(items, auth_token, callback) {
    var async = require('../lib/async-master/lib/async');

    function to_map(item, single_item_callback) {
        getChannelEntryFromDiscoverItem(item, auth_token, single_item_callback);
    }

    async.map(items, to_map, function (err, entries) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, entries);
        }
    });
}


exports.getSpotDetails = function (request, response) {
    var utils = require('../utils');
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var spot_id = request.query.spot_id;
    var token = new Buffer(request.query.token, 'base64').toString('ascii');
    var url = citylife.getSpotDetailsCall + spot_id;

    requestlib({
        uri: url,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': "Bearer " + token
        }
    }, function (error, responselib, body) {
        if (error || responselib.statusCode != 200) {
            response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                    "response": {}
                });
        } else {
            response.send({
                "meta": utils.createOKMeta(),
                "response": JSON.parse(body)
            });
        }
    });
}


/**
 *
 * Find relevant spots for a user based on his location
 * @param token user token
 * @param latitude latitude of the user
 * @param longitude longitude of the user
 * @return JSON response
 */
exports.findRelevantSpots = function (request, response) {
    // declare external files
    var utils = require('../utils');
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var gm = require('../lib/googlemaps');

    // check for url parameters; lat, long and token should be defined.
    if (typeof request.query.latitude !== undefined && typeof request.query.longitude !== undefined && typeof request.query.token !== undefined) {

        var token = new Buffer(request.query.token, 'base64').toString('ascii');
        // date time is also required for the City Life API, so get it in the right format
        var time = new Date();
        var now = "" + time.getFullYear() + "-" + utils.addZero(time.getMonth()) + "-" + utils.addZero(time.getDay()) + " " + utils.addZero(time.getHours()) + ":" + utils.addZero(time.getMinutes()) + ":" + utils.addZero(time.getSeconds());

        var url = discoverChannelCall_new 
            "&latitude= " + request.query.latitude + 
            "&longitude=" + request.query.longitude +
            "&time=" + now;

        // do call to citylife discover API
        requestlib({
            uri: url,
            method: "GET",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        }, function (error, responselib, body) {
            if (responselib.statusCode != 200 || error) {
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                    "response": {}
                });
            } else {
                // parse the result to JSON
                var jsonResult = JSON.parse(body);

                getSpotsFromDiscoverItems(jsonResult.results, token, function (err, spots) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + err),
                            "response": {}
                        });
                    } else {
                        // calculate a static map for each relevant spot
                        // and add it to the spot object as a new field.
                        // I'm dirty and I know it.
                        var markers = [];
                        for (var i = 0; i < spots.length; ++i) {
                            markers[0] = { 'location': spots[i].point.latitude + " " + spots[i].point.longitude };
                                spots[i].mapspng = gm.staticMap(
                                    '',
                                    15,
                                    '250x250',
                                    false,
                                    false,
                                    'roadmap',
                                    markers,
                                    null,
                                    null);
                        }
                        
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": spots
                        });
                    }
                });
            }
        });
    } else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'latitude', 'longitude' or 'token' parameter has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
}

/**
 *
 * The main function responsible for generating a route. It is a recursive function which ends when the maximum number of spots is reached, or no relevant spot is found within the radius.
 * @param lat latitude of the previous spot
 * @param long longitude of the previous spot
 * @param name channel name of the channel in which to search for relevant spots
 * @param radius radius (in km) in which to search for relevant spots
 * @param minGroupSize minimum group size for the route
 * @param maxGroupSize maximum group size for the route
 * @param startDate start date when the group is valid
 * @param endDate end date when the group stops being valid
 * @param jsonResult contains the list of previous spots already added to the route
 * @param response allows us to return a response from within this function
 * @param token the bearer_token of the user
 */
function findSpotByChannel (lat, long, names, radius, minGroupSize, maxGroupSize, startDate, endDate, jsonResult, response, token) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var gm = require('../lib/googlemaps');

    // date time is also required for the City Life API, so get it in the right format
    var time = new Date();
    var now = "" + time.getFullYear() + "-" + utils.addZero(time.getMonth()) + "-" + utils.addZero(time.getDay()) + " " + utils.addZero(time.getHours()) + ":" + utils.addZero(time.getMinutes()) + ":" + utils.addZero(time.getSeconds());

    var namesArray = names.split("|");

    if (namesArray.length > 1 && jsonResult.length - 1 >= namesArray) {
        saveGeneratedRoute(minGroupSize, maxGroupSize, startDate, endDate, jsonResult, namesArray[0], response);
        return;
    }

    var nextChannelName = "";
    if (namesArray.length > 1) {
        nextChannelName = namesArray[jsonResult.length - 1];
    } else {
        nextChannelName = namesArray[0];
    }

    // do call to the CityLife API
    requestlib({
        uri: citylife.discoverChannelCall,
        method: "POST",
        form: {
            "longitude": long,
            "latitude": lat,
            "time": "" + now,
            "params": '{ "channel": "' + nextChannelName + '" }',
            "bearer_token": token
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, responselib, body) {
        if (responselib.statusCode != 200 || error) {
            // bad request
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
        } else {
            // parse the result of the request to JSON
            var body = JSON.parse(body);

            // iterate through the list of spots returned by the API call
            for (var i = 0; i < body.response.data.items.length; ++i) {
                // only continue if the resulted spot is within the radius
                if (parseInt(body.response.data.items[i].meta_info.distance) < radius) {
                    var found = false;
                    // check if the spot is already in the route
                    for (var j = 0; j < jsonResult.length; ++j) {
                        if (parseInt(jsonResult[j].item) == body.response.data.items[i].link.params.id) {
                            found = true;
                        }
                    }
                    // if the spot is not in the route yet
                    if (!found) {
                        // create json of spot id
                        var result = {
                            "item": '' + body.response.data.items[i].link.params.id
                        }
                        // add the spot to the route
                        jsonResult.push(result);
                        // if the route is at its max length, save it
                        if (jsonResult.length >= 10) {
                            saveGeneratedRoute(minGroupSize, maxGroupSize, startDate, endDate, jsonResult, namesArray, response);
                        } else {
                            // if route can be longer, execute this function again but with parameters from the last spot added
                            findSpotByChannel(body.response.data.items[i].meta_info.latitude, body.response.data.items[i].meta_info.longitude, names, radius, minGroupSize, maxGroupSize, startDate, endDate, jsonResult, response);
                        }
                        return;
                    }
                }
            }
            // if no other relevant spot is found within the radius, save the route.
            // the route must exist of at least 2 spots
            if (jsonResult.length > 1) {
                saveGeneratedRoute(minGroupSize, maxGroupSize, startDate, endDate, jsonResult, namesArray, response);
            } else {
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "There are no possible routes found for this starting point and channel."),
                    "response": {}
                });
            }
        }
    });
};


/**
 * Stores the generated route in the database
 * @param minGroupSize minimum group size for the route
 * @param maxGroupSize maximum group size for the route
 * @param startDate start date when the group is valid
 * @param endDate end date when the group stops being valid
 * @param jsonResult array containing the list of spots in the route
 * @param names names of the channels which are used to create the route
 * @param response allows us to return a response from within this function
 */
saveGeneratedRoute = function (minGroupSize, maxGroupSize, startDate, endDate, jsonResult, names, response) {
    // declare external files
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');
    var routesFile = require('./routes');
    
    var namesString = "";
    if (names.length == 1) {
        namesString = names[0];
    } else {
        namesString += names[0];
        for (var i = 1; i < names.length - 1; ++i) {
            namesString += ", " + names[i];
        }
        namesString += " and " + names[names.length - 1] + ".";
    }

    // insert the generated route in the database
    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.collection);
        collection.insert({
            'name': 'Generated Route',
            'description': 'This is a generated route using the following channels: ' + namesString,
            'points': jsonResult,
            'minimumGroupSize': minGroupSize,
            'maximumGroupSize': maxGroupSize,
            'startDate': startDate,
            'endDate': endDate
        }, function (err, docs) {
            if (err) {
                response.send({
                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                    "response": {}
                });
            } else {
                // this function is used to return the generated route to the user, and contains a boolean as parameter so it knows a static png still has to be generated and added
                routesFile.searchById(docs[0]._id, response, false);
            }
        });
    });
};

/**
 * Returns a list of nearby Spots.
 * @param latitude the latitude of the location
 * @param longitude the longitude of the location
 * @return json representation of nearby Spots
 */
exports.findSpotsByLatLong = function (request, response) {
    // declare external files
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var gm = require('../lib/googlemaps');
    var async = require('../lib/async-master/lib/async');

    // check for url parameters, lat and long should be defined.
    if (typeof request.query.latitude !== undefined && typeof request.query.longitude !== undefined && typeof request.query.token !== undefined) {
        var token = new Buffer(request.query.token, 'base64').toString('ascii');
        
        // date time is also required for the City Life API, so get it in the right format
        var time = Math.round((new Date()).getTime() / 1000);
        //var now = "" + time.getFullYear() + "-" + utils.addZero(time.getMonth()) + "-" + utils.addZero(time.getDay()) + " " + utils.addZero(time.getHours()) + ":" + utils.addZero(time.getMinutes()) + ":" + utils.addZero(time.getSeconds());
        // send request to CityLife API

        requestlib({
            uri: (citylife.discoverChannelCall_new + "?latitude=" + request.query.latitude + "&longitude=" + request.query.longitude + "&time=" + time),
            method: "GET",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        }, function (error, responselib, body) {
            if (responselib.statusCode != 200 || error) {
                // bad request
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                    "response": {}
                });
            } else {
                // parse the result to a JSON
                var jsonResult = JSON.parse(body);

                 getChannelEntriesFromDiscoverItems(jsonResult.results, token, function (err, entries) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + err),
                            "response": {}
                        });
                    } else {
                        // calculate a static map for each relevant spot
                        // and add it to the spot object as a new field.
                        // I'm dirty and I know it.
                        var markers = [];
                        for (var i = 0; i < entries.length; ++i) {
                            markers[0] = { 'location': entries[i].point.latitude + " " + entries[i].point.longitude };
                                entries[i].mapspng = gm.staticMap(
                                    '',
                                    15,
                                    '250x250',
                                    false,
                                    false,
                                    'roadmap',
                                    markers,
                                    null,
                                    null);
                        }
                        
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": entries
                        });
                    }
                });
            }
        });
    } else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'longtiude' or 'latitude' field has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
};

/**
 * Checks the user in at a specific spot
 * @param bearer token the user's token
 * @param spot_id the id of the spot where the user checks in.
 * @param channel the id of the channel in which the spot appeared.
 * @return json basic response
 */
exports.checkIn = function (request, response) {
    // declare external files
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');


    // check for url parameters, lat and long should be defined.
    if (typeof request.query.token !== undefined && typeof request.query.spot_id !== undefined !== request.query.channel) {
        var token = new Buffer(request.query.token, 'base64').toString('ascii');

        requestlib({
            uri: citylife.checkinCall,
            method: "POST",
            json: {
                "item": request.query.spot_id, 
                "channel": request.query.channel
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token
            }
        }, function (error, responselib, body) {
            if ((responselib.statusCode != 200) && (responselib.statusCode != 201) || error) {
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                    "response": {}
                });
            } else {
                getSpotFromCheckIn(body, token, function (err, spot) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                            "response": {}
                        });
                    } else {
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": spot
                        });
                    }
                });
            }
        });
    } else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'token', 'spot_id' or channel field has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
};

/**
 * Search for spots
 * @param token the user's bearer_token
 * @param latitude latitude of the user
 * @param longitude longitude of the user
 * @param search_term searchterm
 * @return something
 */
exports.search = function (request, response) {
    // declare external file
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var async = require('../lib/async-master/lib/async');

    // check for url parameters, lat and long should be defined.
    if (typeof request.query.token !== undefined && typeof request.query.latitude !== undefined && typeof request.query.longitude !== undefined && typeof request.query.search_term !== undefined && typeof request.query.token !== undefined) {

        var token = new Buffer(request.query.token, 'base64').toString('ascii');
        // date time is also required for the City Life API, so get it in the right format
        var time = new Date();
        var now = "" + time.getFullYear() + "-" + utils.addZero(time.getMonth()) + "-" + utils.addZero(time.getDay()) + " " + utils.addZero(time.getHours()) + ":" + utils.addZero(time.getMinutes()) + ":" + utils.addZero(time.getSeconds());

        requestlib({
            uri: (citylife.discoverChannelCall_new + "?latitude=" + request.query.latitude + "&longitude=" + request.query.longitude + "&time=" + now + "&search=" + request.query.search_term),
            method: "GET",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': "Bearer " + token
            }
        }, function (error, responselib, body) {
            if (responselib.statusCode != 200 || error) {
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                    "response": {}
                });
            } else {
                var results = (JSON.parse(body)).results;
                getSpotsFromChannelEntries(results, request.query.token, function(err, spots) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                            "response": {}
                        });
                    } else {
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": spot
                        });
                    }
                });
            }
        });
    } else {
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'token', 'latitude', 'longitude' or 'search_term' field has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
};


/**
 * Returns the details of a Spot.
 * @param id the id of the Spot
 * @return json representation of the Spot
 */
exports.findById = function (request, response) {
    // declare external files
    var utils = require("../utils");
    var https = require('https');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var token = new Buffer(request.query.token, 'base64').toString('ascii');

    // send request to the CityLife API
    requestlib({
        uri: request.query.id,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': "Bearer " +  token
        }
    }, function (error, responselib, body) {
        if (responselib.statusCode != 200 || error) {
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
        } else {
            response.send(jsonResult);
        }
    });
};


exports.getCompleteGroupsForRouteStartingAtSpot = function (request, response) {
    // declare external files
    var utils = require("../utils");
    var https = require('https');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var groups = require('../urlroutes/groups');
    var async = require('../lib/async-master/lib/async');

    var user_id = request.query.user_id;
    var spot_id = request.query.spot_id;
    var route_id = request.query.route_id;
    var token = new Buffer(request.query.token, 'base64').toString('ascii');

    var CHECKIN_TIMEOUT = 300 * 1000; // 300 seconds

    function isUserNearby(member_id, callback) {
        var checkins_url = citylife.checkinCall + "?item_id=" + spot_id + "&user_id=" + member_id + "&" + citylife.config_solomidem_secret;

        requestlib({
            uri: checkins_url,
            method: "GET",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': "Bearer " +  token
            }
        }, function (error, responselib, body) {
            if (responselib.statusCode != 200 || error) {
                callback(error, null);
            } else {
                var checkins = (JSON.parse(body)).results;
                if (checkins.length < 1) {
                    callback(null, { user: member_id, nearby: false });
                } else {
                    var checkin_date = new Date(checkins[0].created_on * 1000);
                    callback(null, { user: member_id, nearby: ((new Date() - checkin_date) < CHECKIN_TIMEOUT) });
                }
            }
        });
    }

    function getNearbyMembersForGroup(group, callback) {
        async.map(group.users, isUserNearby, function (err, nearbyOrNotArray) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, { group: group, nearbyMembers: nearbyOrNotArray });
            }
        });
    }

    groups.findGroupsByMemberId(
        user_id,
        function (groups) {
            async.map(groups, getNearbyMembersForGroup, function (err, groupsArray) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else {
                    response.send({
                        "meta": utils.createOKMeta(),
                        "response": groupsArray
                    });
                }
            });
        },
        function (err) {
            response.send({
                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                "response": {}
            });
        });
}

// allow this function to be called from other modules
//exports.findSpotByChannel = findSpotByChannel;