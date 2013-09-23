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

    //var ObjectID = require('mongodb').ObjectID;
    
    var resultAmount = 0;

    // find the route by its id.
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

    // find the route by its name.
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


exports.findByMember = function(request, response) {
    var mongojs = require('mongojs');
    var member_id = request.body.member;
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

    // find the route by its name.
    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.groupscollection);
        collection.find({ 'users': { $all: [ member_id ] } })
             .toArray(function (err, docs) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                            "response": {}
                        });
                    } else {
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": { "groups": docs }
                        });
                    }
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

    // find the route by its name.
    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        console.log("Adding group");
        var collection = db.collection(config.groupscollection);
        console.log("1");
        collection.find({ 'name': name })
            .each(function (err, docs) {
                console.log("2");
                if (err) { 
                    console.log("3 " + err);
                    response.send({
                        "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        "response": {}
                    });
                } else if (!docs) {
                    console.log("4");
                    //server.mongoConnectAndAuthenticate(function (err, conn, db) {
                     //   var db = mongojs(config.dbname);
                       // var collection = db.collection(config.groupscollection);
                        // insert the route in the database
                        collection.insert({
                            "name": request.body.name,
                            "creator": creator_id,
                            "users": [ creator_id ],
                            "requestingUsers": []
                        }, function (err, docs) {
                            console.log("5");
                            if (err) {
                                console.log("6 " + err);
                                response.send({
                                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                                    "response": {}
                                });
                            } else {
                                // this function returns a result to the user
                                /*require('mongodb').connect(server.mongourl, function (err, conn) {
                                    collection.find()
                                        .forEach(function (err, docs) {
                                            console.log(docs);
                                        });
                                });*/
                                console.log("7");
                                queryById(docs[0]._id, response);
                                console.log("8");
                            }
                        });
                    //});   
                } else {
                    console.log("9");
                    // increase resultAmount so on next iteration the algorithm knows the id was found.
                    resultAmount++;

                    response.send({
                           "meta": utils.createErrorMeta(400, "X_001", "This group already exists. " + err),
                           "response": {}
                    });         
                }
            });
    });

    /*require('mongodb').connect(server.mongourl, function (err, conn) {
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
        });*/
}


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

exports.cancelMembershipRequest = function(request, response) {
    exports.declineRequestingUser(request, response);
}


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

exports.getProfileForMembership = function(request, response) {
    var utils = require("../utils");
    var https = require('https');
    var querystring = require('querystring');
    var requestlib = require('request');
    var citylife = require('../auth/citylife');

    var userid = request.body.userid;
    var token = request.body.token;
    var groupid = request.body.groupid

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