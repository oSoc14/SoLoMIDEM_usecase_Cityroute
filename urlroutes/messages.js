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

    var user_id = request.params.user_id;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var collection = db.collection(config.messagesCollection);
        collection.find({ $or: [ { 'receiver_id': user_id }, { 'sender_id': user_id } ] })
             .toArray(function (err, docs) {
                    if (err) {
                        response.send({
                            "meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                            "response": {}
                        });
                    } else {
                        response.send({
                            "meta": utils.createOKMeta(),
                            "response": { "messages": docs }
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
            	"response": { "message": message }
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
                    "response": {}
                });
            } else {
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

    var sender_id = request.body.sender_id;
    var groupId = request.body.group_id;
    var content = request.body.content;
    var date = new Date();

    var resultAmount = 0;

    server.mongoConnectAndAuthenticate(function (err, conn, db) {
        var groupscollection = db.collection(config.groupscollection);
        groupscollection.find({ 'id': groupId })
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
                    var sent_count = 0;
                    for (var i = docs.users.length - 1; i >= 0; i--) {
                        sendMessageToUser(
                        	sender_id,
                        	docs.users[i],
                        	content,
                        	new Date(),
                        	function() {
                        		sent_count = sent_count + 1
                        	})
                    };
                    if (sent_count == docs.users.length) {
                    	response.send({
            				"meta": utils.createOKMeta(),
            				"response": { "message": message }
        				});
                    } else {
                    	response.send({
                        	"meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the MongoDB: " + err),
                        	"response": {}
                    	});
                    }        
                }
            });
    });
}