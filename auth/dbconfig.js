/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 *
 * Database configuration
 *
 * This code assumes either a local deployment or a cloud hosting deployment: tested on Heroku.
 *
 */


var dbname = "CityRoute";
var collection = "routes";
var groupscollection = "groups";
var cachedUsersCollection = "users";
var uitidscollection = "uitids";
var messagesCollection = "messages";
var usersCollection = "users";

// In case of local MongoDB, use the default port for a MongoDB. Change this if your config is different.
var mongourl = "mongodb://localhost:27017";

var secret = "xxxxxxxx";

exports.dbname = dbname;
exports.collection = collection;
exports.groupscollection = groupscollection;
exports.cachedUsersCollection = cachedUsersCollection;
exports.uitidscollection = uitidscollection;
exports.messagesCollection = messagesCollection;
exports.usersCollection = usersCollection;
exports.mongourl = mongourl;
exports.secret = secret;