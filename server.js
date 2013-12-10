/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * Node.js entry point
 *
 * This code assumes either a local deployment or a cloud hosting deployment: tested on Heroku.
 * The database is a MongoDB hosted on MongoHQ. Swap the MongoHQ-specific code for code opening
 * a connection to a local database for a pure local deployment.
 *
 */

// declare external files
var WebSocketServer = require('ws').Server
var express = require("express");
var utils = require("./utils");
var moment = require('moment');
var users = require("./urlroutes/users");
var spots = require("./urlroutes/spots");
var routes = require("./urlroutes/routes");
var groups = require("./urlroutes/groups");
var messages = require("./urlroutes/messages");
var config = require("./auth/dbconfig.js");

// use express and its bodyParser for POST requests.
var app = express();
app.use(express.bodyParser());

// prevent server death in case of uncaught exceptions
process.on('uncaughtException', function (exception) {
    console.log(exception);
});

/**
 * Check if there is a process.env db config (such as on Heroku) that stores the URL to the MongoDB.
 * If not, use the direct URL to a mongoDB stored in the db config.
 */
var mongourl;
if (process.env.MONGOHQ_URL) {
     mongourl = process.env.MONGOHQ_URL;
}
else {
    mongourl = config.mongourl;
}


exports.mongourl = mongourl;


// This function can be used to open a connection to the MongoDB.
// In case of a succesful connect or an error, the callback is called.
// In the first case the opened db is passed as a parameter.
function mongoConnectAndAuthenticate(callback) {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect(mongourl, function(err, db) {
        // Maybe we should do this somewhere else, checking every single db connect for indexes
        // is probably overkill.
        (db.collection(config.groupscollection)).ensureIndex( { name: 1 }, function(err, idxName) {
            (db.collection(config.collection)).ensureIndex( { startDate: 1, endDate: 1 }, function(err, idxName) {
                if (err) {
                    console.log(err);
                }
                callback(err, null, db);
            });
        });
    });
}

exports.mongoConnectAndAuthenticate = mongoConnectAndAuthenticate;


// define the users API url routes.
app.post("/users/login", users.login);
app.get("/users/logout/:token", users.logout);
app.post("/users/profile", users.getProfile);

app.post("/cultuurnet/linkuitid", users.linkUitId);
app.post("/cultuurnet/onrequesttokenreceived", users.onRequestTokenReceived);
//app.get("/users/:key", users.dropAll);

// define the spots API url routes.
app.get("/spots", spots.findSpotsByLatLong);
app.get("/spots/checkin", spots.checkIn);
app.get("/spots/relevant", spots.findRelevantSpots);
app.get("/spots/search", spots.search);
app.get("/spots/:id", spots.findById);
// TODO: app.get("/spots/usersnearby/:userid", spots.getNearbyUsers);

// define the routes API url routes.
app.post("/routes/routesatspot", routes.findRoutesStartingAtSpot);
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

app.post("/messages/send", messages.sendMessage);
app.post("/messages/foruser", messages.getMessages);
app.post("/messages/sendtogroup", messages.sendMessageToGroup);
app.post("/messages/markasread", messages.markMessagesAsRead);


app.use(express.static(__dirname + '/clientpage'));

// start server on port 8888 OR on the port in the cloud deployment config.
console.log("Listening on port " + (process.env.PORT || 8888) +  "...");
app.listen(process.env.PORT || 8888);


var CONNECTED_WEBSOCKETS_UNREADMESSAGES = {};


function sendNumberOfUnreadMessages(userid, number) {
    var socket = CONNECTED_WEBSOCKETS_UNREADMESSAGES[userid];
    if (socket) {
        CONNECTED_WEBSOCKETS_UNREADMESSAGES[userid].send(number);
    };
}

exports.sendNumberOfUnreadMessages = sendNumberOfUnreadMessages;

var messagesWebSocketServer = new WebSocketServer({ server: app });
console.log('Messages websocket server created');

messagesWebSocketServer.on('connection', function(ws) {
    ws.send('new_messages_for_user?');

    ws.on('user_id', function(userid) {
        CONNECTED_WEBSOCKETS_UNREADMESSAGES[userid] = ws;
        messages.getNumberOfUnreadMessages(userid, function (number) { 
            sendNumberOfUnreadMessages(receiver_id, number);
        });
    });

  ws.on('close', function() {
    delete CONNECTED_WEBSOCKETS_UNREADMESSAGES[userid];
  });
});