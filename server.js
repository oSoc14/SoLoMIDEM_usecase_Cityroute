/*
 * @author: Thomas Stockx
 * @copyright: OKFN Belgium
 *
 * Node.js entry point
 */

// declare external files
var express = require("express");
var utils = require("./utils");
var users = require("./urlroutes/users");
var spots = require("./urlroutes/spots");
var routes = require("./urlroutes/routes");
var groups = require("./urlroutes/groups")
var config = require("./auth/dbconfig.js");

// use express and its bodyParser for POST requests.
var app = express();
app.use(express.bodyParser());

// prevent server death in case of uncaught exceptions
process.on('uncaughtException', function (exception) {
    console.log(exception);
});

/**
 * Our hosting service provides database information in the VCAP_SERVICES environment variable.
 * If it does not exist, we'll connect to a localhost MongoDB.
 */
/*if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
}
else {
    var mongo = {
        "hostname": "localhost",
        "port": 27017,
        "username": "",
        "password": "",
        "name": "",
        "db": config.dbname
    }
}*/

/**
 * Building the URL to the MongoDB.
 */
/*ar generate_mongo_url = function (obj) {
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if (obj.username && obj.password) {
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
    else {
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}*/


//var mongourl = generate_mongo_url(mongo);
var mongourl = "mongodb://heroku:1e0ab9b723c4326cb2f9771bfc20d507@paulo.mongohq.com:10015/app18191768";
exports.mongourl = mongourl;

function mongoConnectAndAuthenticate(callback) {
    /*var mongodb = require('mongodb');
    var db = new mongodb.Db('nodejitsu_alombide_nodejitsudb3534441553',
               new mongodb.Server('ds039257.mongolab.com', 39257, {}), {safe: true});
    console.log("SERVER: got DB");
    db.open(function (err, db_p) {
        if (err) { console.log(err); throw err; }
        console.log("SERVER: opened DB");
        db.authenticate('nodejitsu_alombide', 'ovu90vs1udlvu90ebjqtg4gflg', function (err, replies) {
            // You are now connected and authenticated.
            console.log("SERVER: authenticated at DB");
            (db_p.collection(config.groupscollection)).ensureIndex( { name: 1 });
            console.log("SERVER: added index to name field of groupscollection");
            callback(err, replies, db_p);
        });
    });*/
    var MongoClient = require('mongodb').MongoClient;

    MongoClient.connect(mongourl, function(err, db) {
        (db.collection(config.groupscollection)).ensureIndex( { name: 1 }, function(err, idxName) { 
            if (err) {
                console.log(err);
            }
            callback(err, null, db);
             db.close();
         });
    });
}

exports.mongoConnectAndAuthenticate = mongoConnectAndAuthenticate;

/**
 * Fix cross-domain requests errors, this should probably be cleaned up before a real release.
 */
app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET,POST");
    next();
});


// define the users API url routes.
app.get("/users/login/:base64", users.login);
app.get("/users/logout/:token", users.logout);
app.post("/users/profile", users.getProfile);
//app.get("/users/:key", users.dropAll);

// define the spots API url routes.
app.get("/spots", spots.findSpotsByLatLong);
app.get("/spots/checkin", spots.checkIn);
app.get("/spots/relevant", spots.findRelevantSpots);
app.get("/spots/search", spots.search);
app.get("/spots/:id", spots.findById);
// TODO: app.get("/spots/usersnearby/:userid", spots.getNearbyUsers);

// define the routes API url routes.
app.get("/routes", routes.findRoutesStartingAtSpot);
app.post("/routes", routes.addRoute);
app.get("/routes/generate/:channelname", routes.generateRoute);
app.get("/routes/generate", routes.generateRouteFromChannelArray);
app.get("/routes/:id", routes.findById);

// define the groups API url routes.
app.post("/groups/id", groups.findById);
app.post("/groups/name", groups.findByName);
app.post("/groups/member", groups.findByMember);
app.post("/groups/addgroup", groups.addGroup);
app.post("/groups/deletegroup", groups.deleteGroup);
app.post("/groups/acceptmembershiprequest", groups.acceptMembershipRequest);
app.post("/groups/requestmembership", groups.addRequestingUser);
app.post("/groups/cancelmembershiprequest", groups.cancelMembershipRequest);
app.post("/groups/declinemembership", groups.declineRequestingUser);
app.post("/groups/removeuser", groups.removeUser);
app.post("/groups/profileformembership", groups.getProfileForMembership);


app.use(express.static(__dirname + '/clientpage'));

// start server on port 1337
console.log("Listening on port 1337...");
app.listen(1337);