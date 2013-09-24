/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Code based on original implementation by Thomas Stockx, copyright OKFN Belgium
 * See: https://github.com/oSoc13/Cityroute
 *
 * Client-side login  functionality
 *
 */

/**
* log a user in
**/
function loginuser(){
    var psw = $("#password").val();
    var userName = $("#username").val();
    var encoded = $.base64('btoa',userName + ":" + psw, false);
    var url =  "http://" + config_serverAddress + "/users/login/" + encoded;
    
    // send a request to the nodeJS API to log the user in
    // parameters: Base64 encoded <username>:<password>
    // returns: bearer token
    
    $.ajax({
       type: 'GET',
       crossDomain:true,
        url: url,
        success: onLoggedIn,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert(errorstatus + ": " + errorthrown);
        }
    });
    $("#login").hide();
    $("#loader").show();
};

/**
* callback function when a user is logged in 
**/
function onLoggedIn(data, textStatus, jqXHR) {
    if (data.meta.code == 200){
        $.cookie("token", data.response.token);
        $.cookie("email", data.response.email);
        $.cookie("user_id", data.response.user_id);

        // TODO: UitID linking

        /*var url =  "http://" + config_serverAddress + "/cultuurnet/linkuitid";

        var postdata = {
            citylifeId: data.response.user_id
        };

        $.ajax({
            url: url,
            data: postdata,
            dataType: "json",
            type: "POST",
            success: onUitIdLinked,
            error: function(jqXHR, errorstatus, errorthrown) {
                alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
            }
        });*/

        location.reload();
    }
    else if (data.meta.code == 401)
        alert("Incorrect username or password");
    else
        alert("The Citylife API returned an error");
};


function onUitIdLinked(data, textStatus, jqXHR) {
    if (data.meta.code != 200) {
        alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
    }
}

/**
* log out
*/
function logOut() {

    var url =  "http://" + config_serverAddress + "/users/logout/" + $.cookie("token");
    // send a request to the nodeJS API to log the user out
    // parameters: the baearer token
    // returns: empty
    $.ajax({
        type: 'GET',
        crossDomain:true,
        url: url,
        success: onLoggedOut,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert(errorstatus + ": aaa" + errorthrown);
        }
    }); 
};

/**
* callback function after logging out
*/
function onLoggedOut(data, textStatus, jqXHR) {
    data = JSON.parse(data);
    if (data.meta.code == 200) {
        $.removeCookie("token");
        location.reload();
    } else {
        alertAPIError(data.meta.message)
    }
};