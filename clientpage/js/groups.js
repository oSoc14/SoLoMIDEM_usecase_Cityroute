/**
* function that shows/hides the correct divs when using groups
*/
function showGroups() {
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
    $("#groups").show();
    refreshGroupsWhereUserIsMemberOf();
    clearSearchResults();
}


function showGroupsForWhichUserIsMember() {
    var user = $.cookie("user_id");
    var url =  "http://" + config_serverAddress + "/groups/member";
    
    /*$.ajax({
        type: 'GET',
        crossDomain:true,
        cache: false,
        url: url,
        success: onShowGroupsForWhichUserIsMember,
        error: function(jqXHR, errorstatus, errorthrown) {
           alert("Error: " + errorstatus + " -- " + jqXHR.responseText);
        }
    });*/

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

function renderLeaveOrDeleteButton(group) {
    if (group.creator == $.cookie("user_id")) {
        return '<tr><td><input type="button" value="Delete group" onclick="deleteGroup(\'' + group._id + '\')"/></td></tr>';
    } else {
        return '<tr><td><input type="button" value="Leave group" onclick="leaveGroup(\'' + group._id + '\')"/></td></tr>';
    }
}

function onShowGroupsForWhichUserIsMember(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        var groups = data.response.groups;
        for (var i = 0; i < groups.length; i++) {
            $("#yourGroups").append(
                "<div id='" + groups[i]._id + "'>" + "<li data= '" + groups[i].name + "'>" + "<h2>" + groups[i].name + "</h2>" + "</li>" +
                '<tr><td><input type="button" value="Show group" onclick="showGroup(\'' + groups[i]._id + '\')"/></td></tr>' +
                renderLeaveOrDeleteButton(groups[i]) +
                "</div>");
        }
        $("#yourGroups").append("<div></div><div></div>");
    } else {
        alertAPIError(data.meta.message);
    }
}


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

function onUserProfileFound(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
       var profile = data.response;
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = profile.thumbnail_url;
       $("#members").append("<div id='" + profile.id + "'>" + 
        "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
        "<li data= '" + profile.id + "'>" + first_name + " " + last_name + "</li>");
    } else {
        alertAPIError(data.meta.message);
    }
}

function onUserMembershipRequestingProfileFound(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
       var profile = data.response.profile;
       var groupid = data.response.groupid;
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = profile.thumbnail_url;
       $("#memberShipRequests").append("<div id='" + profile.id + "'>" + 
            "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
            "<li data= '" + profile.id + "'>" + first_name + " " + last_name + "</li>");
       $("#memberShipRequests").append(
            '<div>' + 
            '<tr><td><input type="button" value="Accept" onclick="acceptMembership(\'' + groupid + '\', \'' + profile.id + '\')"/></td></tr>' +
            '<tr><td><input type="button" value="Decline" onclick="declineMembership(\'' + groupid + '\', \'' + profile.id + '\')"/></td></tr>' +
            '<div>');
    } else {
        alertAPIError(data.meta.message);
    }
}


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

function onAcceptMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You accepted the request.");
    } else {
        alertAPIError(data.meta.message);
    }
}

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

function onDeclineMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You declined the request.");
    } else {
        alertAPIError(data.meta.message);
    }
}


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


function onLeaveGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("You left the group.");
    } else {
        alertAPIError(data.meta.message);
    }
}


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

function onDeleteGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("Group deleted.");
    } else {
        alertAPIError(data.meta.message);
    }
}


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


function onRequestMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
       searchGroup();
       alert("Membership requested.");
    } else {
        alertAPIError(data.meta.message);
    }
}

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

function onCancelRequestMembership(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
       searchGroup();
       alert("Membership request cancelled.");
    } else {
        alertAPIError(data.meta.message);
    }
}


function onProfileFoundForSearch(data, textStatus, jqXHR) {
     if (data.meta.code == 200) {
       var profile = data.response;
       var first_name = profile.first_name;
       var last_name = profile.last_name;
       var thumbnail_url = profile.thumbnail_url;
       $("#foundgroup").append("<div id='" + profile.id + "'>" + 
        "<img src='" + thumbnail_url + "' alt='<profile thumbnail>'>" +
        "<li data= '" + profile.id + "'>" + first_name + " " + last_name + "</li>");
    } else {
        alertAPIError(data.meta.message);
    }
}


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


function onAddGroup(data, textStatus, jqXHR) {
    if (data.meta.code == 200) {
        refreshGroupsWhereUserIsMemberOf();
       alert("Group created.");
    } else {
        alertAPIError(data.meta.message);
    }
}


function refreshGroupsWhereUserIsMemberOf() {
    if ($("#yourGroups").length > 0) {
            $("#yourGroups").empty();
        };
        showGroupsForWhichUserIsMember();
}

function clearSearchResults() {
    if ($("#searchGroupResults").length > 0) {
            $("#searchGroupResults").empty();
        };
        //showGroupsForWhichUserIsMember();
}