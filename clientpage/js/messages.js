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
    changeView('messages');

    var before_date = new Date();
    before_date.setDate(before_date.getDate() + 1);
    var after_date = new Date();
    after_date.setDate(before_date.getDate() - 8);
    displayMessages(before_date, after_date);
  }



// Show the messages
function displayMessages(before_date, after_date) {
    $("#yourMessages").prepend("<p>Loading new messages...</p>");

    var url =  "http://" + config_serverAddress + "/messages/foruser";
    var postdata = {
        'user_id':  $.cookie("user_id"),
        'token': $.cookie("token")
    }
    if(before_date) postdata.before_date = before_date;
    if(after_date) postdata.after_date = after_date;
  
    $.ajax({
       type: 'POST',
       dataType: "json",
        url: url,
        data: postdata,
        success: onMessagesReceived,
        error: function(jqXHR, errorstatus, errorthrown) {
           console.log("Error: " + errorstatus);
        }
    });
}


function onMessagesReceived(data, textStatus, jqXHR) {
    // pretty print date, make messages browsable by date (currently shows messages of last 7 days)
    if (data.meta.code == 200) {
        $('#navMessages').html('Messages <b>' + 0 + ' new</b>');

        $('#yourMessages').empty();
        var messagesAndUsers = data.response;
        messagesAndUsers.forEach(function (messageAndUser) {
            displayMessage(messageAndUser.sender,  messageAndUser.receiver, messageAndUser.message); 
        });

        var url =  "http://" + config_serverAddress + "/messages/markasread";
        var postdata = {
            'user_id': $.cookie("user_id"),
            'read_until': new Date()
        }
  
        $.ajax({
            type: 'POST',
            dataType: "json",
            url: url,
            data: postdata,
            success: function() { 
            },
            error: function(jqXHR, errorstatus, errorthrown) {
                console.log("Error: " + errorstatus);
            }
        });
    } else {
        alertAPIError(data.meta.message);
    }
}


function loadOlderMessages() {
    displayMessages(null, null);
}

function displayMessage(sender, receiver, message) {
  var thumbnail_url = sender.avatar;
  if (thumbnail_url === null) {
    thumbnail_url = "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcQ8Td7gR7EGtVUXW0anusOpK5lXteu5DFavPre2sXu5rly-Kk68";
  }
  var content = message.content;
  var date = message.date;
  var mom = moment(new Date(date)).fromNow();
  var direction = message.sender_id == $.cookie('user_id') ? 'To ' + receiver.first_name + ' ' + receiver.last_name : 'From ' + sender.first_name + ' ' + sender.last_name;

  $('#yourMessages').append(
    '<div id="' + message.id + '" class="message">' +
    '<img src="' + thumbnail_url + '" alt="Thumb">' +
    '<p>' +
    '<span class="message-direction">' + direction + '</span> ' +
    content +
    '</p>' +
    '<p class="message-moment">' + mom + '</p> ' +
    '</div>');

}
