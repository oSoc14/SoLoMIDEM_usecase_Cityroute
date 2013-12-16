/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Implementation of messages API
 */


/*
 * A message object looks as follows:
 *
 *  {
 *      sender_id: 		Sender id of the message,
        receiver_id: 	Receiver id of the message
        content: 		The message content,  
    	date: 			The message sending date
 *  }
 */


exports.getMessages = function(request, response) {
	var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');
    var users = require('../urlroutes/users.js');

    var user_id = request.body.user_id;
    var before_date = request.body.before_date;
    var after_date = request.body.after_date;
    var token = request.body.token;

    if (before_date == null) {
        before_date = new Date();
    } else {
        before_date = new Date(request.body.before_date);
    }

    if (after_date == null) {
        after_date = new Date();
        after_date.setDate(after_date.getDate() - 365);
    } else {
        after_date = new Date(request.body.after_date);
    }

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.messagesCollection);
        collection.find({ $or: [ { 'receiver_id': user_id }, { 'sender_id': user_id } ], 'date': { $gte: after_date, $lte: before_date } })
             .toArray(function (err, docs) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                            "response": {}
                        });
                    } else {
                    	var messagesAndUsers = [];
                    	docs.forEach(function (message) {
                    		users.linkUsersToMessage(
                    			message,
                    			message.sender_id,
                    			message.receiver_id,
                    			token, 
                    			function (result) {
                    				messagesAndUsers.push(result);
                    				if (messagesAndUsers.length == docs.length) {
                    					messagesAndUsers.sort(function (x, y) {
                    						return (new Date(x.message.date)).getTime() > (new Date(y.message.date)).getTime();
                    					});
                    					response.send({
                            				"meta": utils.createOKMeta(),
                            				"response": messagesAndUsers
                       					 });
                    				}
                    			},
                    			function (error) {
                    				response.send({
                						"meta": utils.createErrorMeta(400, "X_001", "The CityLife API returned an error. Please try again later. " + error),
                						"response": {}
            						});
                    			})
                    	});
                    }
        });
    });
}


 exports.sendMessage = function(request, response) {
 	var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');

    var sender_id = request.body.sender_id;
    var receiver_id = request.body.receiver_id;
    var content = request.body.content;
    var date = new Date();

    sendMessageToUser(
    	sender_id, 
    	receiver_id, 
    	content, 
    	new Date(), 
    	function() {
    		response.send({
            	"meta": utils.createOKMeta(),
            	"response": { "message": content }
        	});
    	});
}


function sendMessageToUser(sender_id, receiver_id, content, date, responseAction) {
	var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');

    var resultAmount = 0;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.messagesCollection);
        var message = {
        	"sender_id": sender_id,
        	"receiver_id": receiver_id,
        	"content": content,
        	"date": date
    	}
        collection.insert(message, function (err, docs) {
            if (err) {
                response.send({
                    "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                    "response": { }
                });
            } else {
                exports.getNumberOfUnreadMessages(receiver_id, function(number) { 
                    server.sendNumberOfUnreadMessages(receiver_id, number);
                });
                return responseAction();
            }
        });  
    });
}


exports.sendMessageToGroup = function(request, response) {
 	var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');
    var utils = require('../utils');
    var ObjectId = mongojs.ObjectId;

    var sender_id = request.body.sender_id;
    var groupId = request.body.group_id;
    var content = request.body.content;
    var date = new Date();

    var resultAmount = 0;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var groupscollection = db.collection(config.groupscollection);
        groupscollection.find({ '_id': ObjectId(groupId) })
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
                    for (var i = 0; i < docs.users.length - 1; i++) {
                        sendMessageToUser(
                        	sender_id,
                        	docs.users[i],
                        	content,
                        	new Date(),
                        	function() {});
                    };
                    response.send({
            			"meta": utils.createOKMeta(),
            			"response": { "message": content }
        			});   
                }
            });
    });
}

exports.markMessagesAsRead = function(request, response) {
    var users = require('../urlroutes/users.js');

    var user_id = request.body.user_id;
    var read_until = request.body.read_until;

    users.setLastMessageReadTimestamp(user_id, read_until);
}


exports.getNumberOfUnreadMessages = function(userid, onFound) {
    var mongojs = require('mongojs');
    var config = require('../auth/dbconfig');
    var server = require('../server');

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var usersCollection = db.collection(config.usersCollection);
        usersCollection.find({ 'user_id': userid })
            .each(function (err, messageTimestamp) {
                var collection = db.collection(config.messagesCollection);
                if (!messageTimestamp) {
                    collection.find({ 'receiver_id': userid })
                        .toArray(function (err, docs) {
                            if (!err) {
                                return onFound(docs.length);
                            } else {
                                return onFound(0);
                            }
                        });
                    } else {
                        collection.find({ 'receiver_id': userid, 'date': { $gt: new Date(messageTimestamp.timestamp) } })
                            .toArray(function (err, docs) {
                                if (!err) {
                                 return onFound(docs.length);
                                } else {
                                    return onFound(0);
                                }
                            });
                    }
            });
        });
}