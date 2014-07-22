'use strict';

/* Enable some jQuery goodness */
$('#sortable').sortable();
$('#sortable').disableSelection();
$(function() {
  $('#tabs').tabs();
});

var socket = io.connect('http://78.23.228.130:8888');

/**
 * Unset user information
 */
function disconnect(field) {
  console.log('disconnect ' + field);
  socket.emit('unset', {
    userid: user._id,
    field: field
  })
}

$(document).ready(function() {
  socket.on('msg', function(data) {
    if (data.success) {
      console.log('Success data:');
      console.log(data);
      socket.emit('msg', {
        received: true
      });
    }
    /* Use user info that server sent */
    if (data.user) {
      console.log('onLogin triggered by socket');
      onLogin(data.user);
    }
  });
});