/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Implementation of Cultuurnet Interface API
 */


exports.getEventsByLatLong = function(request, response) {
	var utils = require('../utils');
	var querystring = require('querystring');
    var https = require('https');
    var requestlib = require('request');

    var latitude = request.body.latitude;
    var longitude = request.body.longitude;
    var url = "http://search.uitdatabank.be/search/rest/search?q=*:*&pt=" + latitude + "," + longitude + "&sfield=physical_gis&d=1&fq={!geofilt}&sort=geodist()+asc";
    
    requestlib({
    	uri: url,
       	method: "GET",
        headers: {
        	'Accept': 'application/json'
        	}
        }, function (error, responselib, body) {
        	if (responselib.statusCode != 200 || error) {
            	response.send({
                	"meta": utils.createErrorMeta(500, "X_001", "Something went wrong with the CultuurNet API " + error),
                    "response": {}
                });
            } else {
                response.send({
                	"meta": utils.createOKMeta(),
                	"response": JSON.parse(body)
            	});
            }
    });
}