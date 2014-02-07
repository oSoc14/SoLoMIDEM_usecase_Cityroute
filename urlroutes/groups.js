/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Implementation of groups API
 */


/*
 * A group object looks as follows:
 *
 *  {
 *      name:               name of the group,
        creator:            CityLife id of the user that created the group (and thus owns the group),
        users:              array of CityLife user ids that are in the group,  
        requestingUsers:    array of CityLife user ids that requested membership and were not accepted/declined yet 
 *  }
 */


// Finds a group by Id in response to POST call
// Returns the group object
exports.findById = function(request, response) {
	var mongojs = require('mongojs');
    var ObjectId = mongojs.ObjectId;
    // search the group in the database and don't edit anything.
    queryById(ObjectId(request.body.id), response);
}

/**
 * Search a group by an id.
 * @param id id of the group
 * @param response allows this function to return the response to the original request
 */
queryById = function(id, response)
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

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
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
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
                    response.send({
                        "meta": utils.createOKMeta(),
                        "response": docs
                    });             
                }
            });
    });
};


// Finds a group by name in response to POST call
// Returns the group object if found.
// Maybe this should become a fuzzy search in the future?
exports.findByName = function(request, response) {
    var mongojs = require('mongojs');
    var name = request.body.name;
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

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ 'name': name })
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
                            "meta": utils.createErrorMeta(400, "X_001", "The group was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
                    response.send({
                        "meta": utils.createOKMeta(),
                        "response": docs
                    });             
                }
            });
    });
}


exports.findGroupsByMemberId = function(userid, callback, errback) {
    var mongojs = require('mongojs');
    var server = require('../server');
    var config = require('../auth/dbconfig');

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ 'users': { $all: [ userid ] } })
             .toArray(function (err, docs) {
                    if (err) {
                        errback(err);
                    } else {
                        callback(docs);
                    }
        });
    });
}


// Find groups by member.
// Returns all groups for which the user is a member (a real member, not just if he/she requested membership).
exports.findByMember = function(request, response) {
    var mongojs = require('mongojs');
    var member_id = request.body.member;
    var utils = require("../utils");
    var querystring = require('querystring');
    var https = require('https');
    var requestlib = require('request');

    exports.findGroupsByMemberId(
        member_id,
        function (groups) {
            response.send({
                "meta": utils.createOKMeta(),
                "response": { "groups": groups }
            });
        },
        function (err) {
            response.send({
                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                "response": {}
            });
        });
}


/**
 * Add a group to the mongoDB database
 * @param a list of ids of users
 * @param a name for the group
 @return the group id
 */
exports.addGroup = function(request, response) {
    // declare external files
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');

    var name = request.body.name;
    var creator_id = request.body.creator_id;

    var resultAmount = 0;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ 'name': name })
            .each(function (err, docs) {
                if (err) { 
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else if (!docs) {
                        collection.insert({
                            "name": request.body.name,
                            "creator": creator_id,
                            "users": [ creator_id ],
                            "requestingUsers": []
                        }, function (err, docs) {
                            if (err) {
                                response.send({
                                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                    "response": {}
                                });
                            } else {
                                queryById(docs[0]._id, response);
                            }
                        });  
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
                    response.send({
                           "meta": utils.createErrorMeta(400, "X_001", "This group already exists. " + err),
                           "response": {}
                    });         
                }
            });
    });
}

// Delete the group with id group_id
exports.deleteGroup = function(request, response) {
    // declare external files
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');

    var groupid = request.body.group_id;
    var ObjectID = require('mongodb').ObjectID;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.remove({ '_id': new ObjectID(groupid) }, function (err, amount_removed) {
                if (err) {
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else if (amount_removed == 0) {
                        response.send({
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                } else {
                    response.send({
                        "meta": utils.createOKMeta(),
                        "amount_removed": amount_removed
                    });             
                }
            });
    });
}


// Accept the membership of user userid requesting the membership for group groupid.
exports.acceptMembershipRequest = function(request, response) {
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
    var groupid = request.body.groupid;
    var userid = request.body.userid;
    var ObjectID = require('mongodb').ObjectID;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ '_id': new ObjectID(groupid) })
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
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
             
                    var requestingUsersArray = docs.requestingUsers;
                    var index = requestingUsersArray.indexOf(userid);
                    requestingUsersArray.splice(index, 1);

                    var usersArray = docs.users;
                    if (usersArray.indexOf(userid) == -1) {
                        usersArray.push(userid);
                    };
                    
                    collection.save(
                        { '_id': new ObjectID(groupid),
                        "name": docs.name,
                        "users": usersArray,
                        "creator": docs.creator,
                        "requestingUsers": requestingUsersArray
                    }, function (err, docs) {
                        if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } else {
                            response.send({
                                "meta": utils.createOKMeta(),
                                "response": { "groupid": groupid }
                            });
                        }
                    });
                }
            });
    });
}


// Add user userid to the list of users requesting membership for group groupid
exports.addRequestingUser = function(request, response) {
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
    var groupid = request.body.groupid;
    var userid = request.body.userid;
    var ObjectID = require('mongodb').ObjectID;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ '_id': new ObjectID(groupid) })
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
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
             
                    var usersArray = docs.requestingUsers;
                    if (usersArray.indexOf(userid) == -1) {
                        usersArray.push(userid);
                    
                        collection.save(
                            { '_id': new ObjectID(groupid),
                            "name": docs.name,
                            "users": docs.users,
                            "creator": docs.creator,
                            "requestingUsers": usersArray
                        }, function (err, docs) {
                            if (err) {
                                response.send({
                                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                    "response": {}
                                });
                            } else {
                                // this function returns a result to the user
                                response.send({
                                    "meta": utils.createOKMeta(),
                                    "response": { "groupid": groupid }
                                });
                            }
                        });
                    } else {
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": { "groupid": groupid }
                        });
                    }
                }
            });
    });
}


// Decline the membership request of user userid for group groupid.
exports.declineRequestingUser = function(request, response) {
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
    var groupid = request.body.groupid;
    var userid = request.body.userid;
    var ObjectID = require('mongodb').ObjectID;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ '_id': new ObjectID(groupid) })
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
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
             
                    var usersArray = docs.requestingUsers;
                    var index = usersArray.indexOf(userid);
                    usersArray.splice(index, 1);
                    
                    collection.save(
                        { '_id': new ObjectID(groupid),
                        "name": docs.name,
                        "users": docs.users,
                        "creator": docs.creator,
                        "requestingUsers": usersArray
                    }, function (err, docs) {
                        if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } else {
                            response.send({
                                "meta": utils.createOKMeta(),
                                "response": { "groupid": groupid }
                            });
                        }
                    });
                }
            });
    });
}

// Cancel a membershiprequest
exports.cancelMembershipRequest = function(request, response) {
    exports.declineRequestingUser(request, response);
}


// Remove user userid from group groupid
exports.removeUser = function(request, response) {
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
    var groupid = request.body.groupid;
    var userid = request.body.userid;
    var ObjectID = require('mongodb').ObjectID;

    // find the route by its id.
    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ '_id': new ObjectID(groupid) })
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
                            "meta": utils.createErrorMeta(400, "X_001", "The ID was not found. " + err),
                            "response": {}
                        });
                    }
                } else {
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;
             
                    var usersArray = docs.users;
                    var index = usersArray.indexOf(userid);
                    usersArray.splice(index, 1);
                    
                    collection.save(
                        { '_id': new ObjectID(groupid),
                        "name": docs.name,
                        "users": usersArray,
                        "creator": docs.creator,
                        "requestingUsers": docs.requestingUsers
                    }, function (err, docs) {
                        if (err) {
                            response.send({
                                "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                "response": {}
                            });
                        } else {
                            response.send({
                                "meta": utils.createOKMeta(),
                                "response": { "groupid": groupid }
                            });
                        }
                    });
                }
            });
    });
}

// Get the CityLife user profile of user userid to display as a member of group groupid
exports.getProfileForMembership = function(request, response) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var userid = request.body.userid;
    var token = request.body.token;
    var groupid = request.body.groupid

    var getUserByIdCall = "https://vikingspots.com/citylife/profiles/" + userid;

    requestlib({
        uri: getUserByIdCall,
         method: "GET",
         headers: {
            'Accept': 'application/json',
            'Authorization': "Bearer " + token
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
            } else {
                var profile = (JSON.parse(body)).response;
                response.send({
                    "meta": utils.createOKMeta(),
                    "response": { 
                        "groupid": groupid,
                        "profile": profile
                    }
                });
            }
        }
    });
}