/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Implementation of users API
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 */


// Keep the uitId credentials here (if linked) so we can use them.
exports.uitId = null;
exports.uit_oauth_token = null;
exports.uit_oauth_token_secret = null;

/**
 * Returns a StartupInfo object that contains information about the user's identity
 * @param Base64 encoded string of username:password
 * @return info of the user, including bearer_token needed for other queries
 */
exports.login = function (request, response) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');

    requestlib({
        uri: citylife.authenticationCall,
        method: "POST",
        json: {},
        headers: {
            'Authorization': "Basic " + request.params.base64,
            'Content-Type': 'application/json'
        }
    }, function (error, responselib, body) {
        if (( responselib.statusCode != 200 && responselib.statusCode != 401 ) || error) {
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
        } else {
            if (responselib.statusCode == 401) {
                response.send({
                    "meta": utils.createErrorMeta(401, "X_001", "Credentials are not valid."),
                    "response": {}
                });
            }
            else {
                response.send(body);
            }
        }
    });
}

// IN PROGRESS: Link an UitID to the CityLife ID of the user.
// This should allow the CultuurNet API to be called to retrieve recommended CultuurNet events for the user.
// This is phase 1 of the UitID authentication protocol.
exports.linkUitId = function (request, response) {
    /*var requestlib = require('request');
    var cultuurnet = require('../auth/cultuurnet');
    var server = require('../server');

    var timestamp = Math.round(new Date() / 1000);
    var nonce = "uitidLogin" + timestamp;
    var consumerKey = "76163fc774cb42246d9de37cadeece8a";

    var citylifeId = request.body.citylifeId;

    console.log("1");

    requestlib({
        uri: cultuurnet.getRequestTokenCall,
        method: "POST",
        json: {},
        headers: {
            'oauth_callback': server.myurl + "/cultuurnet/onrequesttokenreceived",
            'oauth_signature': "signature",
            'oauth_version': "1.0",
            'oauth_nonce': nonce,
            'oauth_consumer_key': consumerKey,
            'oauth_signature_method': "HMAC-SHA1",
            'timestamp': timestamp,
            'citylifeId': citylifeId
        }
    }, function (error, responselib, body) {
        console.log("2");
        if (( responselib.statusCode != 200) || error) {
            console.log("3");
            response.send({
                "meta": utils.createErrorMeta(400, "X_002", "Login with UitID failed. " + error),
                "response": {}
            });
            console.log("4");
        } else {
            console.log("5");
            var body = JSON.parse(body);
            console.log("6");
            var oauth_token = body.oauth_token;
            console.log("7");
            respone.redirect('http://test.uitid.be/culturefeed/rest/auth/authorize', {
                'oauth_token': oauth_token,
                'type': "regular"
            });
            console.log("8");
        }
    });*/
}

// Phase 2 of UitID authentication protocol
exports.onRequestTokenReceived = function (request, respone) {
    var server = require('../server');
    var requestlib = require('request');
    var cultuurnet = require('../auth/cultuurnet');

    var timestamp = Math.round(new Date() / 1000);
    var nonce = "onRequestTokenReceived" + timestamp;

    var consumerKey = "76163fc774cb42246d9de37cadeece8a";
    var oauth_token = request.params.oauth_token;
    var citylifeId = request.params.citylifeId;
    var oauth_verifier = request.params.oauth_verifier;
    
    requestlib({
        uri: cultuurnet.getAccessTokenCall,
        method: "POST",
        json: {},
        headers: {
            'oauth_callback': server.myurl + "/cultuurnet/onrequesttokenreceived",
            'oauth_signature': "signature",
            'oauth_version': "1.0",
            'oauth_nonce': nonce,
            'oauth_consumer_key': consumerKey,
            'oauth_signature_method': "HMAC-SHA1",
            'timestamp': timestamp,
            'oauth_token': oauth_token, 
            'oauth_verifier': oauth_verifier
        }
    }, function (error, responselib, body) {
        var body = JSON.parse(body);
        exports.uitId = body.userId;
        exports.uit_oauth_token = body.oauth_token;
        exports.uit_oauth_token_secret = body.oauth_token_secret;

        var mongojs = require('mongojs');
        var config = require('../auth/dbconfig');
        var db = mongojs(config.dbname);
        var collection = db.collection(config.uitidsCollection);

        var resultAmount = 0;

    require('mongodb').connect(server.mongourl, function (err, conn) {
        collection.find({ 'citylife_id': citylifeId })
            .forEach(function (err, docs) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else if (!docs) {
                    require('mongodb').connect(server.mongourl, function (err, conn) {
                        // insert the route in the database
                        var doc = {
                            "citylife_id": userid,
                            "uitid": body.userId,
                            "uit_oauth_token": body.oauth_token,
                            "uit_oauth_token_secret": body.oauth_token_secret
                        };
                        collection.insert(doc, function (err, docs) {
                            if (err) {
                                response.send({
                                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                    "response": {}
                                });
                            } else {
                               response.send({
                                    "meta": utils.createOKMeta(),
                                    "response": doc
                                });
                            }
                        });
                    });   
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
                    response.send({
                           "meta": utils.createErrorMeta(400, "X_001", "This UiTID was already linked. " + err),
                           "response": {}
                    });         
                }
            });
        });
    });
}


/**
 * Logs the user out
 * @param token bearer_token of the user
 * @return info describing an anonymous user
 */
exports.logout = function (request, response) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    requestlib({
        uri: citylife.deAuthenticationCall,
        method: "POST",
        form: {
            "bearer_token": request.params.token
        },
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, responselib, body) {
        if ((responselib.statusCode != 200 && responselib.statusCode != 401) || error) {
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
        } else {
            if (responselib.statusCode == 401) {
                response.send({
                    "meta": utils.createErrorMeta(401, "X_001", "Credentials are not valid."),
                    "response": {}
                });
            }
            else {
                response.send(body);
            }
        }
    });
}


// Gets the user profile for the CityLife ID of the user
exports.getProfile = function (request, response) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var userid = request.body.id;
    var token = request.body.token;

    var getUserByIdCall = "https://vikingspots.com/en/api/4/users/importbyid?bearer_token=" + token + "&userid=" + userid;

    requestlib({
        uri: getUserByIdCall,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, responselib, body) {
        if (( responselib.statusCode != 200 && responselib.statusCode != 401 ) || error) {
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
        } else {
            if (responselib.statusCode == 401) {
                response.send({
                    "meta": utils.createErrorMeta(401, "X_001", "Credentials are not valid."),
                    "response": {}
                });
            }
            else {
                response.send(body);
            }
        }
    });
}

exports.linkUsersToMessage = function(message, sender_id, receiver_id, token, successCallback, failCallback) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var getSenderCall = "https://vikingspots.com/en/api/4/users/importbyid?bearer_token=" + token + "&userid=" + sender_id;
    var getReceiverCall = "https://vikingspots.com/en/api/4/users/importbyid?bearer_token=" + token + "&userid=" + receiver_id;

    requestlib({
        uri: getSenderCall,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, responselib, sender) {
        if (( responselib.statusCode != 200 && responselib.statusCode != 401 ) || error) {
            failCallback(error);
        } else {
            if (responselib.statusCode == 401) {
                failCallback(error);
            } else {
                requestlib({
                    uri: getReceiverCall,
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }, function (error, responselib, receiver) {
                    if (( responselib.statusCode != 200 && responselib.statusCode != 401 ) || error) {
                        failCallback(error);
                    } else {
                        if (responselib.statusCode == 401) {
                            failCallback(error);
                        } else {
                            successCallback({ 
                                'message': message, 
                                'sender': (JSON.parse(sender)).response, 
                                'receiver': (JSON.parse(receiver)).response 
                            });
                        }
                    }
                });
            }
        }
    });
}


/**
 * Temporary function to drop everything from database and start from scratch.
 */
/*exports.dropAll = function (request, response) {
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');
    var db = mongojs(config.dbname);
    var collection = db.collection(config.collection);
    var groupscollection = db.collection(config.groupscollection);
    if (request.params.key == config.secret) {
        require('mongodb').connect(server.mongourl, function (err, conn) {
            collection.drop(function (err, docs) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(400, "X_001", "Something went wrong with the MongoDB :( : " + err),
                        "response": {}
                    });
                } else {
                    response.send(JSON.stringify(docs));
                }
            });
             groupscollection.drop(function (err, docs) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(400, "X_001", "Something went wrong with the MongoDB :( : " + err),
                        "response": {}
                    });
                } else {
                    response.send(JSON.stringify(docs));
                }
            });
        });
    } else {
        response.send({
            "meta": utils.createErrorMeta(403, "X_001", "Incorrect key."),
            "response": {}
        });
    }
}*/