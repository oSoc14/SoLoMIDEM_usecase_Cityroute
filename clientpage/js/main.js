'use strict';

/* Enable some jQuery goodness */
$('#sortable').sortable();
$('#sortable').disableSelection();
$(function() {
  $('#tabs').tabs();
});

$(document).ready(function() {
  var socket = io.connect('http://78.23.228.130:8888');
  socket.on('msg', function(data) {
    console.log(data);
    if (data.success) {
      console.log('Success');
      socket.emit('msg', {
        received: true
      });
    }
    /* Use user info that server sent */
    if (data.user) {
      console.log('Got user data');
      onLogin(data.user);
    }
  });
});