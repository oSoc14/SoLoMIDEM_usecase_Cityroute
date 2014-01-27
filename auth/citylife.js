/**
 * @author: Thomas Stockx
 * @copyright: OKFN Belgium
 *
 * Contains the URI's to the CityLife API (not public)
 */

var authenticationCall = "https://vikingspots.com/en/api/4/basics/login/";

var authenticationCall_new = "https://id.citylife.be/auth/token/";

var deAuthenticationCall = "https://vikingspots.com/en/api/4/basics/logout/";
var discoverChannelCall = "https://vikingspots.com/en/api/4/channels/discoverchannel/";

var discoverChannelCall_new = "https://vikingspots.com/citylife/channels/discover/";

var getSpotByIdCall = "https://vikingspots.com/en/api/4/spots/getbyid?spot_id=";

var getSpotByIdCall_new = "https://vikingspots.com/citylife/items/";

var getUserByIdCall = "https://vikingspots.com/en/api/4/users/importbyid?userid=";
var channelCall = "https://vikingspots.com/en/api/4/channels/call/";
var discoverCall = "https://vikingspots.com/en/api/4/channels/discover/";

var checkinCall = "https://vikingspots.com/citylife/checkins/";

exports.authenticationCall = authenticationCall;

exports.authenticationCall_new = authenticationCall_new;

exports.deAuthenticationCall = deAuthenticationCall;
exports.discoverChannelCall = discoverChannelCall;

exports.discoverChannelCall_new = discoverChannelCall_new;

exports.getSpotByIdCall = getSpotByIdCall;
exports.getSpotByIdCall_new = getSpotByIdCall_new;


exports.channelCall = channelCall;
exports.discoverCall = discoverCall;
exports.getUserByIdCall = getUserByIdCall;

exports.checkinCall = checkinCall;