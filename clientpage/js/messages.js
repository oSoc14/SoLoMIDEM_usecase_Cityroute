/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Messaging functionality for the client
 *
 */

/**
* function that shows/hides the correct divs when using messages
*/
function showMessages() {
    $("#geolocationPar").hide();
    $("#map-canvas").hide();
    $("#map-canvas").height(0);
    $("#routes").hide();
    $("#spotlist").hide();
    $("#routeBuilder").hide();
    $("#sortableInput").html("");
    $("#spotListTable").html("");
    $("#suggestions").html("");
    $("#recommended").html("");
    $("#spotInfo").hide();
    $("#routeSpots").hide();
    $("#searchform").hide();
    $("#tabs").hide();
    $("#searchresults").html("");
    window.clearInterval(taskID);
    nearbySpotOpened = false;
    $("#generate").hide();
    $("#channels").html("");
    $("#groups").hide();
    $("#messages").show();
}