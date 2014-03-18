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
    var startdate = request.body.startdate;
    var enddate = request.body.enddate;
    var startISODate = "*";
    var endISODate = "*";
    if (startdate !== null && startdate !== undefined && startdate !== "") {
    	startISODate = (new Date(startdate)).toISOString();
    }
    if (enddate !== null && enddate !== undefined && enddate !== "") {
    	endISODate = (new Date(enddate)).toISOString();
    }
    var url = "http://search.uitdatabank.be/search/rest/search?q=*:*&pt=" + latitude + "," + longitude + 
    	"&sfield=physical_gis&d=" + 1 +
    	"&availablefrom:[" + startISODate + "+TO+" + endISODate + "]&fq={!geofilt}&sort=geodist()+asc";
   
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