/**
 * @author: Thomas Stockx
 * @copyright: OKFN Belgium
 */

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
                /*console.log("body: " + JSON.stringify(body, null, 4));
                var db = mongojs(config.dbname);
                var collection = db.collection(config.cachedUsersCollection);
                require('mongodb').connect(server.mongourl, function (err, conn) {
                    collection.count(function (err, count) {
                        searchUserIdAndStoreInCache(request, response, body.token, body.email, count, function (userid) {
                            body.user_id = userid;*/
                            response.send(body);
                        /*});
                    })
                })*/
            }
        }
    });
}


/*function searchUserIdAndStoreInCache(request, response, token, email, index, onIdFound) {
    var utils = require("../utils");
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var db = mongojs(config.dbname);
    var collection = db.collection(config.cachedUsersCollection);

    require('mongodb').connect(server.mongourl, function (err, conn) {
        collection.findOne({ 'email': email }, function (err, doc) {
                if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } else {
                if (doc == null) {
                    findUncachedUser(request, response, token, email, index, onIdFound);
                } else {
                    onIdFound(doc.citylife_id);
                }
            }             
        });
    });
}


function findUncachedUser(request, response, token, email, index, onIdFound) {
    var utils = require("../utils");
    var requestlib = require('request');
    var usersPerSearch = 100;
    var importUsersCall = "https://vikingspots.com/en/api/4/users/import/?bearer_token=" + token + "&index=" + index + "&max=" + usersPerSearch;
    console.log(importUsersCall);
    requestlib({
        uri: importUsersCall,
        method: "GET",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function (error, responselib, body) {
        if (( responselib.statusCode != 200 && responselib.statusCode != 401 ) || error) {
            console.log("error " + responselib.statusCode);
            response.send({
                "meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                "response": {}
            });
            return false;
        } else {
            if (responselib.statusCode == 401) {
                response.send({
                    "meta": utils.createErrorMeta(401, "X_001", "Credentials are not valid."),
                    "response": {}
                });
                return false;
            }
            else {
                var userList = body.items;
                var foundUser = false;
                for (var i = 0; i < userList.length; i++) {
                    cacheUser(response, userList[i]);
                    if (userList[i].email == email) {
                        foundUser = userList[i];
                    }
                }
                if (!foundUser) {
                    searchUserIdAndStoreInCache(request, response, token, email, index + usersPerSearch, usersPerSearch);
                } else {
                    onIdFound(foundUser.id);
                }
            }
        }
    });
} 


function cacheUser(response, user) {
    var utils = require("../utils");
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var db = mongojs(config.dbname);
    var collection = db.collection(config.cachedUsersCollection);
    require('mongodb').connect(server.mongourl, function (err, conn) {
        collection.findOne({ 'email': user.email }, function (err, docs) {
                if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } else {
                if (doc == null) {
                    collection.insert({
                        "email": user.email,
                        "citylife_id": user.id
                    }, function (err, docs) {
                        if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } 
                    });
                }
            }             
        });
    });
}*/


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