/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 */


/**
* on document ready: verify if a user is logged in, show and hide the correct views
**/
$(document).ready( function() {
    // if a user is logged in
    if ($.cookie("token") != null) {
        changeView('geostatus');
        getGeolocation();
    }
    // if a user is not is not logged in
    else {
        changeView('login')
    }
    
});

/**
* prepares the page to change the view by hiding and clearing the content
*/
var currentView = '';
function changeView(newView) {
    $('body').removeClass(currentView + '-active').addClass(newView + '-active');
    currentView = newView;

    // stop the location tracking
    window.clearInterval(taskID);
    nearbySpotOpened = false;
};

/**
* restart the web-application: hide all the views, clear necessary data and refresh the page.
*/
function restart() {
    changeView('geostatus');
    getGeolocation();
    
    // stop the location tracking
    window.clearInterval(taskID);
    nearbySpotOpened = false;
};

/**
* show an arror when something goes wrong with an API call
* @param message: the error message that will be shown
*/
function alertAPIError(message) {
    alert("The CityLife API returned the following error message: " + message.msg_text);
};