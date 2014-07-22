﻿/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 *  Implementation of routes API
 *
 *  Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 *  See: https://github.com/oSoc13/Cityroute
 */

/*
 * A route object looks as follows:
 *
 *  {
 *      name:               The name of the route,
        description:        The description of the route,
        points:             The array of CityLife spots and/or CultuurNet events on the route,
        minimumGroupSize:   The minimum size of a group to participate in the route (minumum 1),
        maximumGroupSize:   The maximum size if a group  to participate in the route (optional, null is unlimited),
        startDate:          The date at which the route starts to be valid (optional),
        endDate:            The date at which the route stops to be valid (optional).
 *  }
 *
 * TODO: extend with iRail public transport spots.
 */

/**
 * Returns a list of Routes starting or ending at a Spot
 * @param spot_id id of the Spot
 * @return json representation of the Routes
 */
exports.findRoutesStartingAtSpot = function (request, response) {
    // declare external files
    var utils = require("../utils");
    var querystring = require('querystring');
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');

    // check for url parameters, spot_id should be defined
    if (typeof request.body.spot_id !== undefined) {
        var spot_id = request.body.spot_id;
        var date = request.body.date;
        if (date == null) {
            date = new Date();
        } else {
            date = new Date(request.body.date);
        }

        // find all routes which have item x as starting point filtered on start and enddate
        server.mongoConnectAndAuthenticate(function (err, conn, db) {
            var collection = db.collection(config.collection);
            collection.find({ 'points.0': { item: request.body.spot_id }, 'startDate': { $lte: date }, 'endDate': { $gte: date } })
                .toArray(function (err, docs) {
                    // the list of routes starting at Spot is stored in the docs array
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                            "response": {}
                        });
                    }
                    else {
                        // find all routes which have item x as ending point
                        collection.find({ $where: 'this.points[this.points.length-1].item == ' + "'" + spot_id + "'", 'startDate': { $lte: date }, 'endDate': { $gte: date } })
                            .toArray(function (err, docs2) {
                                if (err) {
                                    response.send({
                                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                        "response": {}
                                    });
                                } else {
                                    // the list of routes ending at Spot is stored in the docs2 array
                                    // concat these arrays, and return the JSON.
                                    var resultDocs = docs;
                                    resultDocs.concat(docs2);
                                    response.send({
                                        "meta": utils.createOKMeta(),
                                        "response": { "routes": resultDocs }
                                    });
                                }
                            });
                    }
                });
        });
    }
    else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'spot_id' has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
}

/**
 * Store a generated route in the database based on the given parameters
 * @param channelname name of the channel to use for generation
 * @param token bearer_token of the session
 * @param latitude latitude of the location
 * @param longitude longitude of the location
 * @param spot_id id of the starting spot
 * @param radius radius to search for each next spot (in km)
 * @param minGroupSize minimum group size for the route
 * @param maxGroupSize maximum group size for the route
 * @param startdate start date when the group is valid
 * @param enddate end date when the group stops being valid
 * @return json representation of the generated route.
 */
exports.generateRoute = function (request, response) {
    // declare external files
    var spotsFile = require("./spots");
    var minimumGroupSize = request.query.minGroupSize;
    var maximumGroupSize = request.query.maxGroupSize;
    var startDate = request.query.startdate;
    var endDate = request.query.enddate;
    if (minimumGroupSize == null) {
        minimumGroupSize = 1;
    }
    if (startDate != null) {
        startDate = new Date(request.query.startdate);
    }
    if (endDate != null) {
        endDate = new Date(request.query.enddate);
    }

    // check for invalid request
    if (typeof request.query.token !== undefined && typeof request.query.latitude !== undefined && typeof request.query.longitude !== undefined && typeof request.query.spot_id !== undefined && typeof request.query.radius !== undefined) {

        // start the route with an array containing the starting spot
        jsonResult = [{
            "item": "" + parseInt(request.query.spot_id)
        }];
        // this function contains the algorithm to generate the route
        spotsFile.findSpotByChannel(request.query.latitude, request.query.longitude, request.params.channelname, request.query.radius, minimumGroupSize, maximumGroupSize, startDate, endDate, jsonResult, response);
    } else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'spot_id', 'token', 'latitude', 'longitude' or 'radius' has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }
}


/**
 * Store a generated route in the database based on the given parameters
 * @param channels array of channel names to use for generation, concatenated with a | symbol
 * @param token bearer_token of the session
 * @param latitude latitude of the location
 * @param longitude longitude of the location
 * @param spot_id id of the starting spot
 * @param radius radius to search for each next spot (in km)
 * @param minGroupSize minimum group size for the route
 * @param maxGroupSize maximum group size for the route
 * @param startdate start date when the group is valid
 * @param enddate end date when the group stops being valid
 * @return json representation of the generated route.
 */
exports.generateRouteFromChannelArray = function (request, response) {
    // declare external files
    var spotsFile = require("./spots");

    var minimumGroupSize = request.query.minGroupSize;
    var maximumGroupSize = request.query.maxGroupSize;
    var startDate = request.query.startdate;
    var endDate = request.query.enddate;
    if (minimumGroupSize == null) {
        minimumGroupSize = 1;
    }
    if (startDate != null) {
        startDate = new Date(request.query.startdate);
    }
    if (endDate != null) {
        endDate = new Date(request.query.enddate);
    }

    // check for invalid request
    if (typeof request.query.token !== undefined && typeof request.query.latitude !== undefined && typeof request.query.longitude !== undefined && typeof request.query.spot_id !== undefined && typeof request.query.radius !== undefined && typeof request.query.channels !== undefined) {
        // start the route with an array containing the starting spot
        jsonResult = [{
            "item": "" + parseInt(request.query.spot_id)
        }];
        // this function contains the algorithm to generate the route
        spotsFile.findSpotByChannel(request.query.latitude, request.query.longitude, request.query.channels, request.query.radius, minimumGroupSize, maximumGroupSize, startDate, endDate, jsonResult, response);
    } else {
        // bad request
        response.send({
            "meta": utils.createErrorMeta(400, "X_001", "The 'spot_id', 'token', 'latitude', 'longitude' or 'radius' has no data and doesn't allow a default or null value."),
            "response": {}
        });
    }

}

/**
 * Returns the details of of a route, including details of each Spot on the Route.
 * @param id the id of a Route
 * @return json representation of the Route
 */
exports.findById = function (request, response) {
    var mongojs = require('mongojs');
    var ObjectId = mongojs.ObjectId;
    var token = new Buffer(request.query.token, 'base64').toString('ascii');
    // search the route in the database and don't edit anything.

    //console.log(request.params.id);

    //var words = request.params.id.split("/");

    //console.log(ObjectId(words[words.length - 2]));

    searchById(ObjectId(request.query.id), response, token, true);
}

/**
 * Search for routes by an id.
 * @param id id of the route
 * @param response allows this function to return the response to the original request
 * @param returnResponse true if normal call, false if the static map png still needs to be generated and added
 */
searchById = function(id, response, token, returnResponse)
{
    // declare external files
    var utils = require("../utils");
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var citylife = require('../auth/citylife');
    var querystring = require('querystring');
    var https = require('https');
    var requestlib = require('request');
    var server = require('../server');

    var resultAmount = 0;

    // find the route by its id.
    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        //var db = mongojs(config.dbname);
        var collection = db.collection(config.collection);
        collection.find({ '_id': id })
            .each(function (err, docs) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else if (!docs) {
                    // we visited all docs in the collection
                    // if docs is empty
                    if (resultAmount == 0) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + id),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
                    // this contains the JSON array with spots
                    var spotArray = docs.points;

                    // initialize parse variables
                    var count = 0;
                    var resultArray = [];
                    var spotsIdArray = [];

                    // create a array containing the spot urls in the right order
                    for (var i = 0; i < spotArray.length; ++i) {
                        if (spotArray[i].event !== undefined) {
                            spotsIdArray[i] = spotArray[i].event;
                        } else {
                            spotsIdArray[i] = spotArray[i].item;
                        }
                    }

                    // for each spot, do a query to the CityLife API for more info about that spot
                    for (var i = 0; i < spotArray.length; ++i) {
                        if (spotArray[i].event !== undefined) {
                            // We have a CultuurNet event
                            var url = spotArray[i].event;
                            requestlib({
                                uri: url,
                                method: "GET",
                                headers: {
                                    'Accept': 'application/json'
                                }
                            }, function (error, responselib, body) {
                                if (error || responselib.statusCode != 200) {
                                    response.send({
                                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the CultuurNet API " + error),
                                        "response": {}
                                 });
                                } else {
                                    var returned = JSON.parse(body);
                                    var event = returned.rootObject[0].event;
                                    // for each spot, parse the result
                                    parseRouteSpots(error, responselib, event, resultArray, spotArray, spotsIdArray, count, docs, response, returnResponse);
                                    count++;
                                }
                            });
                        } else {
                            // We have a CityLife spot
                            var url = spotArray[i].item;
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
                                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the CityLife API " + error),
                                        "response": {}
                                    });
                                } else {
                                    // for each spot, parse the result
                                    parseRouteSpots(error, responselib, JSON.parse(body), resultArray, spotArray, spotsIdArray, count, docs, response, returnResponse);
                                    count++;
                                }
                            });
                        }
                    }
                }
            });
    });
};



/**
 * Callback for spotid call of citylife for route details
 * @param error standard callback variable of request library
 * @param responselib standard callback variable of request library
 * @param body standard callback variable of request library
 * @param resultArray array that will be filled with all spot data
 * @param spotArray array containing all spot data
 * @param spotsIdArray array containing all spot id's of the route in the right order
 * @param count variable which hold the amount of completed requests
 * @param docs result of the route query in mongoDB
 * @param response used to create a response to the client
 */
parseRouteSpots = function (error, responselib, body, resultArray, spotArray, spotsIdArray, count, docs, response, returnResponse) {
    // delcare external files
    var requestlib = require('request');
    var gm = require('../lib/googlemaps');
    var utils = require('../utils');
    var jsonResult = body;

    // insert the results in the correct order as they are defined by a route.
    for (var i = 0; i < spotsIdArray.length; ++i) {
        if (jsonResult.cdbid !== undefined) {
            var event_id = "http://search.uitdatabank.be/search/rest/detail/event/" + jsonResult.cdbid;
            if (spotsIdArray[i] == event_id) {
                resultArray[i] = jsonResult;
            }
        } else {
            var spot_id = jsonResult.url;
            if (spotsIdArray[i] == spot_id) {
                resultArray[i] = jsonResult;
            }
        }
    }

    // if all external API calls are returned, respond with the ordered JSON array.
    // also included are the name and the id of the route.
    if (count == spotArray.length - 1) {
        // create necessary data for Google Maps Directions and Static Maps
        var markers = [];
        var points = [];

        // fill markers array with long and lat, and include a label based on route order.
        for (var j = 0; j < resultArray.length; ++j) {
            if (resultArray[j].point !== undefined) {
                markers[j] = { 'label': j+1, 'location': resultArray[j].point.latitude + " " + resultArray[j].point.longitude };
            } else {
                var gis = ((resultArray[j].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
                markers[j] = { 'label': j+1, 'location': gis.ycoordinate + " " + gis.xcoordinate };
            }
        }

        // define the number of spots and the waypoints string
        var numSpots = resultArray.length - 1;
        var waypoints = "";

        // define location of start and endpoint
        var originLat = null;
        var originLong = null;
        var destLat = null;
        var destLong = null;

        if (resultArray[0].point !== undefined) {
            originLat = resultArray[0].point.latitude;
            originLong = resultArray[0].point.longitude;
        } else {
            var gis = ((resultArray[0].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
            originLat = gis.ycoordinate;
            originLong = gis.xcoordinate;
        }
        if (resultArray[numSpots].point !== undefined) {
            destLat = resultArray[numSpots].point.latitude;
            destLong = resultArray[numSpots].point.longitude;
        } else {
            var gis = ((resultArray[numSpots].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
            destLat = gis.ycoordinate;
            destLong = gis.xcoordinate;
        }

        var latLong = originLat + ", " + originLong;
        var destLatLong = destLat + ", " + destLong;

        // fill waypoint string with spots between start and endpoint
        for (var i = 1; i < numSpots; ++i) {
            if (resultArray[i].point !== undefined) {
                waypoints += resultArray[i].point.latitude + ", " + resultArray[i].point.longitude + "|";
            } else {
                var gis = ((resultArray[i].contactinfo.addressAndMailAndPhone)[0]).address.physical.gis;
                waypoints += gis.ycoordinate + ", " + gis.xcoordinate + "|";
            }
        }

        // Do a query to the Google Maps Directions API
        requestlib({
            uri: gm.directions(
                latLong,
                destLatLong,
                null,
                false,
                'walking',
                waypoints,
                null,
                null,
                'metric',
                null),
            method: "GET"
        }, function (error, responselib, body) {
            if (responselib.statusCode != 200 || error) {
                response.send({
                    "meta": utils.createErrorMeta(400, "X_001", "The Google Directions API is currently unavailable." + error),
                    "response": {}
                });
            } else {
                // parse the results of the Google Maps Directions API
                parseDirectionResults(error, responselib, body, resultArray, markers, docs, response, returnResponse);
            }
        });
    }
}



/**
 * Callback for query of Google Maps Direction API
 * @param error standard callback variable of request library
 * @param responselib standard callback variable of request library
 * @param body standard callback variable of request library
 * @param resultArray array that will be filled with all spot data
 * @param markers contains all markers for the creation of a static map
 * @param docs result of the route query in mongoDB
 * @param response used to create a response to the client
 */
parseDirectionResults = function (error, responselib, body, resultArray, markers, docs, response, returnResponse) {
    // declare external files
    var polyline = require('polyline');
    var gm = require('../lib/googlemaps');
    var config = require('../auth/dbconfig');
    var mongojs = require('mongojs');
    var server = require('../server');
    var utils = require('../utils');

    // parse the result of the Google Directions API to a JSON object
    var jsonResult = JSON.parse(body);

    // decode the polyline representation of the route to a readable array of lat and longs.
    var points = polyline.decodeLine(jsonResult.routes[0].overview_polyline.points);
    var paths = [];
    paths[0] = { 'points': points };

    // if normal request, send the response to the user
    if (returnResponse) {
        response.send({
            "meta": utils.createOKMeta(),
            "response": {
                "name": docs.name,
                "id": docs._id,
                "description": docs.description,
                "spots": resultArray,
                "png": docs.png
            }
        });
    }
    else {
        // The static map png still has to be generated first

        // find the route by its id, generate a static map png and add it to the database
        server.mongoConnectAndAuthenticate(function (err, conn, db) {
            //var db = mongojs(config.dbname);
            var collection = db.collection(config.collection);
            var ObjectId = mongojs.ObjectId;
            collection.update(
                { '_id': docs._id },
                {
                    $set: {
                        'png': gm.staticMap(
                            '',
                            '',
                            '250x250',
                            false,
                            false,
                            'roadmap',
                            markers,
                            null,
                            paths)
                    }
                },
                { multi: true },
                function (err, docs2) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                            "response": {}
                        });
                    } else {
                        // return the route including its png
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": {
                                "name": docs.name,
                                "id": docs._id,
                                "description": docs.description,
                                "spots": resultArray,
                                "png": gm.staticMap(
                                    '',
                                    '',
                                    '250x250',
                                    false,
                                    false,
                                    'roadmap',
                                    markers,
                                    null,
                                    paths)
                            }
                        });
                    }
                });
        });
    }
}



/**
 * Add a route to the mongoDB database
 * @param a list of ids of spots
 * @param a name for the route
 * @param a description for the route
 * @param minimumGroupSize minimum group size for the route
 * @param maximumGroupSize maximum group size for the route
 * @param startDate start date when the group is valid
 * @param endDate end date when the group stops being valid
 @return the route id
 */
exports.addRoute = function (request, response) {
    // declare external files
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');

    var startDate = request.body.startDate;
    var endDate = request.body.endDate;
    if (startDate != null) {
        startDate = new Date(request.body.startDate);
    }
    if (endDate != null) {
        endDate = new Date(request.body.endDate);
    }

    console.log(request.body.points);

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        //var db = mongojs(config.dbname);
        var collection = db.collection(config.collection);
        var minimumGroupSize = request.body.minimumGroupSize;
        var maximumGroupSize = request.body.maximumGroupSize;
        if (minimumGroupSize == null) {
            minimumGroupSize = 1;
        }

        var token = request.body.token;

        // insert the route in the database
        collection.insert({
            "name": request.body.name,
            "description": request.body.description,
            "points": request.body.points,
            "minimumGroupSize": minimumGroupSize,
            "maximumGroupSize": maximumGroupSize,
            "startDate": startDate,
            "endDate": endDate
        }, function (err, docs) {
            if (err) {
                console.log(err);
                response.send({
                    "meta": utils.createErrorMeta(500, "X_001",
                        "Something went wrong with the MongoDB: " + err),
                    "response": {}
                });
            } else {
                // this function returns a result to the user, but a boolean is set so the static map png will be generated first.
                searchById(docs[0]._id, response, token, false);
            }
        });
    });
};

// searchById should be usable from other modules
exports.searchById = searchById;
