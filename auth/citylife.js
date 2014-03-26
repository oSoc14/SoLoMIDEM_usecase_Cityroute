/**
 * @author: Thomas Stockx
 * @copyright: OKFN Belgium
 *
 * Contains the URI's to the CityLife API (not public)
 */

// SECRET TO GET PRIVATE USER INFO FROM CITYLIFE, REQUEST YOUR SECRET API KEY
var config_solomidem_secret = "";

var authenticationCall_new = "https://id.citylife.be/auth/token/";

var deAuthenticationCall = "https://vikingspots.com/en/api/4/basics/logout/";

var discoverChannelCall_new = "https://vikingspots.com/citylife/channels/discover/";

var getSpotByIdCall_new = "https://vikingspots.com/citylife/items/";

var getSpotDetailsCall = "https://vikingspots.com/citylife/spots/";

var checkinCall = "https://vikingspots.com/citylife/checkins/";


exports.authenticationCall_new = authenticationCall_new;
exports.deAuthenticationCall = deAuthenticationCall;
exports.discoverChannelCall_new = discoverChannelCall_new;
exports.getSpotByIdCall_new = getSpotByIdCall_new;
exports.checkinCall = checkinCall;
exports.getSpotDetailsCall = getSpotDetailsCall;
exports.config_solomidem_secret = config_solomidem_secret;