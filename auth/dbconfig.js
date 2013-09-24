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

// This authentication data now passed directly in the URL should be hidden somewhere, because now it is in the code.
// Maybe as a parameter to the startup script?
var mongourl = "mongodb://heroku:1e0ab9b723c4326cb2f9771bfc20d507@paulo.mongohq.com:10015/app18191768";

var secret = "xxxxxxxx";

exports.dbname = dbname;
exports.collection = collection;
exports.groupscollection = groupscollection;
exports.cachedUsersCollection = cachedUsersCollection;
exports.uitidscollection = uitidscollection;
exports.mongourl = mongourl;
exports.secret = secret;