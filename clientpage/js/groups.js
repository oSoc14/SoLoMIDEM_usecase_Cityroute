/*
 * @author: Andoni Lombide Carreton
 * @copyright: SoLoMIDEM ICON consortium
 *
 * Groups functionality for the client
 *
 */

/**
* function that shows/hides the correct divs when using groups
*/
function showGroups() {
    changeView('groups');

    refreshGroupsWhereUserIsMemberOf();
    clearSearchResults();
}

// Show all the groups for which the user is member in the GUI
function showGroupsForWhichUserIsMember() {
    var user = $.cookie("user_id");
    var url =  "http://" + config_serverAddress + "/groups/member";

    var member = {
        member: user
    };

    $.ajax({
        url: url,
        data: member,
        dataType: "json",
        type: "POST",
        success: onShowGroupsForWhichUserIsMember,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// If user is group owner: delete group button
// If user is not group owner: leave group button 
function renderLeaveOrDeleteButton(group) {
    if (group.creator == $.cookie("user_id")) {
        return '<tr><td><input type="button" value="Delete group" onclick="deleteGroup(\'' + group._id + '\')"/></td></tr>';
    } else {
        return '<tr><td><input type="button" value="Leave group" onclick="leaveGroup(\'' + group._id + '\')"/></td></tr>';
    }
}

// Callback for when a group for which the user is member is sent back by the server
function onShowGroupsForWhichUserIsMember(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var groups = data.response.groups;
        for (var i = 0; i < groups.length; i++) {
            $("#yourGroups").append(
                "<div id='" + groups[i]._id + "'>" + "<li data= '" + groups[i].name + "'>" + "<h2>" + groups[i].name + "</h2>" + "</li>" +
                '<tr><td><input type="button" value="Show group" onclick="showGroup(\'' + groups[i]._id + '\')"/></td></tr>' +
                '<tr><td><input type="button" value="Message group" onclick="messageGroup(\'' + groups[i]._id + '\')"/></td></tr>' +
                renderLeaveOrDeleteButton(groups[i]) +
                "</div>");
        }
        $("#yourGroups").append("<div></div><div></div>");
    } else {
        alertAPIError(data.meta.message);
    }
}

function messageGroup(groupId) {
    if ($("#messagediv").length > 0) {
        $("#messagediv").remove();
    };
    $("#" + groupId).append(
        '<div id="messagediv"><tr><td><textarea id="messageText" rows="7" cols="40"/></td></tr>' + "<br>" +
        '<tr><td><input type="button" value="Send" onclick="sendMessageToGroup(\'' + groupId + '\')"/></td></tr></div>');
}


function sendMessageToGroup(groupId) {
    var url =  "http://" + config_serverAddress + "/messages/sendtogroup";
    var postdata = {
        sender_id: $.cookie("user_id"),
        group_id: groupId,
        content: $("#messageText").val()
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onMessageSent,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}


// Show the contents of a group in the GUI
function showGroup(groupId) {
    var url =  "http://" + config_serverAddress + "/groups/id";
    var searchdata = {
        id: groupId
    };
    $.ajax({
        url: url,
        data: searchdata,
        dataType: "json",
        type: "POST",
        success: onShowGroup,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered with the contents of a group.
function onShowGroup(data, textStatus, jqXHR) {
    if ($("#expandedGroup").length > 0) {
        $("#expandedGroup").remove();
    };
    if (data.meta.code == 200) {
       var group = data.response;
       $("#yourGroups").append("<div id='expandedGroup'></div>");
       $("#expandedGroup").append("<div id='members'></div>");
       $("#expandedGroup").append("<div id='memberShipRequests'></div>");

        // Group members
       $("#members").append("<h3>The members of " + group.name + ": </h3>");
        for (var i = 0; i < group.users.length; i++) {
            var searchdata = { 
                id: group.users[i],
                token: $.cookie("token")
            };
            var url =  "http://" + config_serverAddress + "/users/profile";
             $.ajax({
                url: url,
                data: searchdata,
                dataType: "json",
                type: "POST",
                success: onUserProfileFound,
                error: function(jqXHR, errorstatus, errorthrown) {
                    alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
                }
            });  
        };

        // Membership requests
        if (group.creator == $.cookie("user_id") && group.requestingUsers.length > 0) {
            $("#memberShipRequests").append("<h3>Pending member requests:</h3>");
            for (var j = 0; j < group.requestingUsers.length; j++) {
                var postdata = { 
                    userid: group.requestingUsers[j],
                    groupid: group._id,
                    token: $.cookie("token")
                };
                var call =  "http://" + config_serverAddress + "/groups/profileformembership";
                $.ajax({
                     url: call,
                    data: postdata,
                    dataType: "json",
                    type: "POST",
                    success: onUserMembershipRequestingProfileFound,
                    error: function(jqXHR, errorstatus, errorthrown) {
                        alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
                    }
                });  
            };
        }
    } else {
        alertAPIError(data.meta.message);
    }
}

// Callback for when the user profile of a member of a group is retrieved.
// Renders the profile in the GUI.
function onUserProfileFound(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
       var profile = JSON.parse(data.response);
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = null;
       if (profile.avatar !== null) {
            thumbnail_url = profile.avatar;
       } else {
            thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
       }
       var id = (profile.url.split('/profiles/'))[1];
       id = (id.split('/'))[0];
       $("#members").append("<div id='" + id + "'>" + 
        "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
        "<li data= '" + id + "'>" + first_name + " " + last_name + "</li>" +
        '<tr><td><input type="button" value="Send message" onclick="messageUser(\'' + id + '\')"/></td></tr>');
    } else {
        alertAPIError(data.meta.message);
    }
}


function messageUser(userId) {
     if ($("#messagediv").length > 0) {
        $("#messagediv").remove();
    };
    $("#" + userId).append(
        '<div id="messagediv"><tr><td><textarea id="messageText" rows="7" cols="40"/></td></tr>' + "<br>" +
        '<tr><td><input type="button" value="Send" onclick="sendMessageToUser(\'' + userId + '\')"/></td></tr></div>');
}


function sendMessageToUser(userId) {
    var url =  "http://" + config_serverAddress + "/messages/send";
    var postdata = {
        sender_id: $.cookie("user_id"),
        receiver_id: userId,
        content: $("#messageText").val()
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onMessageSent,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

function onMessageSent(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        if ($("#messagediv").length > 0) {
            $("#messagediv").remove();
        }
        alert("Message sent!");
    } else {
        alertAPIError(data.meta.message);  
    }
}


// Callback for when the user profile of a user requesting membership of a group is retrieved.
// Renders the profile in the GUI.
function onUserMembershipRequestingProfileFound(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
        var response = JSON.parse(data.response);
       var profile = response.profile;
       var groupid = response.groupid;
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = null;
       if (profile.avatar !== null) {
            thumbnail_url = profile.avatar;
       } else {
            thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
       }
       var id = (profile.url.split('/profiles/'))[1];
       id = (id.split('/'))[0];
       $("#memberShipRequests").append("<div id='" + id + "'>" + 
            "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
            "<li data= '" + id + "'>" + first_name + " " + last_name + "</li>");
       $("#memberShipRequests").append(
            '<div>' + 
            '<tr><td><input type="button" value="Accept" onclick="acceptMembership(\'' + groupid + '\', \'' + id + '\')"/></td></tr>' +
            '<tr><td><input type="button" value="Decline" onclick="declineMembership(\'' + groupid + '\', \'' + id + '\')"/></td></tr>' +
            '<div>');
    } else {
        alertAPIError(data.meta.message);
    }
}

// Accepts the membership of user userId for group groupId.
function acceptMembership(groupId, userId) {
    var url =  "http://" + config_serverAddress + "/groups/acceptmembershiprequest";
    var postdata = {
        groupid: groupId,
        userid: userId
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onAcceptMembership,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to acceptMembership
function onAcceptMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You accepted the request.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Declines the membership of user userId for group groupId.
function declineMembership(groupId, userId) {
    var url =  "http://" + config_serverAddress + "/groups/declinemembership";
    var postdata = {
        groupid: groupId,
        userid: userId
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onDeclineMembership,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to declineMembership
function onDeclineMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You declined the request.");
    } else {
        alertAPIError(data.meta.message);
    }
}


// Makes the user leave the group passed as a parameter
function leaveGroup(group) {
    var postdata = { 
        groupid: group,
        userid: $.cookie("user_id")
    };
    var url =  "http://" + config_serverAddress + "/groups/removeuser";
    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onLeaveGroup,
        error: function(jqXHR, errorstatus, errorthrown) {
            alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });  
}

// Callback for when the server answered to leaveGroup
function onLeaveGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You left the group.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Deletes the group
function deleteGroup(groupId) {
    var url =  "http://" + config_serverAddress + "/groups/deletegroup";
    var postdata = {
        group_id: groupId
    };
    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onDeleteGroup,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to deleteGroup
function onDeleteGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("Group deleted.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Tries to find a group with the search term typed in by the user.
function searchGroup() {
    if ($("#foundgroup").length > 0) {
        $("#foundgroup").remove();
    };
    var searchTerm = $("#searchGroupTerm").val();
    var url =  "http://" + config_serverAddress + "/groups/name";
    var searchdata = {
        name: searchTerm
    };
    $.ajax({
        url: url,
        data: searchdata,
        dataType: "json",
        type: "POST",
        success: onSearchGroup,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to searchGroup
function onSearchGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var group = data.response;
       $("#searchGroupResults").append("<div id='foundgroup'></div>");
       $("#foundgroup").append("<h2>" + group.name + "</h2>");
       if (group.users.indexOf($.cookie("user_id")) == -1) {
            if (group.requestingUsers.indexOf($.cookie("user_id")) == -1) {
                $("#foundgroup").append('<tr><td><input type="button" value="Request membership" onclick="requestMembership(\'' + group._id + '\')"/></td></tr>');
            } else {
                $("#foundgroup").append('<tr><td><input type="button" value="Cancel membership request" onclick="cancelMembershipRequest(\'' + group._id + '\')"/></td></tr>');
            }
       } else {
            $("#foundgroup").append(renderLeaveOrDeleteButton(group));
       }
       $("#foundgroup").append("<h3>The members of " + group.name + ": </h3>");
        for (var i = 0; i < group.users.length; i++) {
            var searchdata = { 
                id: group.users[i],
                token: $.cookie("token")
            };
            var url =  "http://" + config_serverAddress + "/users/profile";
             $.ajax({
                url: url,
                data: searchdata,
                dataType: "json",
                type: "POST",
                success: onProfileFoundForSearch,
                error: function(jqXHR, errorstatus, errorthrown) {
                    alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
                }
            });  
        };
        $("#searchGroupResults").append("<div id='foundgroup'></div>");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Requests the membership for the user for group groupId.
function requestMembership(groupId) {
    var url =  "http://" + config_serverAddress + "/groups/requestmembership";
    var postdata = {
        groupid: groupId,
        userid: $.cookie("user_id")
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onRequestMembership,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to requestMembership
function onRequestMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
       searchGroup();
       alert("Membership requested.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Cancel the membership request of user userid for group groupId
function cancelMembershipRequest(groupId) {
    var url =  "http://" + config_serverAddress + "/groups/cancelmembershiprequest";
    var postdata = {
        groupid: groupId,
        userid: $.cookie("user_id")
    };

    $.ajax({
        url: url,
        data: postdata,
        dataType: "json",
        type: "POST",
        success: onCancelRequestMembership,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to cancelMembershipRequest
function onCancelRequestMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
       searchGroup();
       alert("Membership request cancelled.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Callback for when a user profile of a group member is found when displaying a group
// that was found using searchGroup
function onProfileFoundForSearch(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
       var profile = JSON.parse(data.response);
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = null;
       if (profile.avatar !== null) {
            thumbnail_url = profile.avatar;
       } else {
            thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
       }
       var id = (profile.url.split('/profiles/'))[1];
       id = (id.split('/'))[0];
       $("#foundgroup").append("<div id='" + id + "'>" + 
        "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
        "<li data= '" + id + "'>" + first_name + " " + last_name + "</li>");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Adds a new group
function addGroup() {
    var groupName = $("#newGroupName").val();
    var url =  "http://" + config_serverAddress + "/groups/addgroup";
    var newGroup = {
        name: groupName,
        creator_id: $.cookie("user_id")
    };

    $.ajax({
        url: url,
        data: newGroup,
        dataType: "json",
        type: "POST",
        success: onAddGroup,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });
}

// Callback for when the server answered to addGroup
function onAddGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("Group created.");
    } else {
        alertAPIError(data.meta.message);
    }
}

// Updates the list of groups for which the user is a member in the GUI.
function refreshGroupsWhereUserIsMemberOf() {
    if ($("#yourGroups").length > 0) {
            $("#yourGroups").empty();
        };
        showGroupsForWhichUserIsMember();
}

// Clears the results of searching a group in the GUI.
function clearSearchResults() {
    if ($("#searchGroupResults").length > 0) {
            $("#searchGroupResults").empty();
        };
        //showGroupsForWhichUserIsMember();
}