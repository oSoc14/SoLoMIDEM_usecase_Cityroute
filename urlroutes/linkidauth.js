/* Dependencies */
var dbServer = require('../server');
var users = dbServer.db.collection('users');

var user = {
  auth: false
};

exports.onConnection = function(socket) {
  console.log('o:connection');
  if (!socket) return;
  console.log('hello!');

  socket.emit('msg', {
    user: user
  });
  socket.on('msg', function(data) {
    console.log('got msg from server');
    console.log(data);
  });

}

exports.onAuthSuccess = function(req, res) {
  console.log('linkid auth received by node');

  user = {
    auth: true,
    name: 'Thomas'
  };

  users.findOne({}, function(err, doc) {
    if (err) console.log(err);
    console.log('send to client');
    doc.auth = true;
    dbServer.io.sockets.emit('msg', {
      success: true,
      user: doc
    });

    setTimeout(function() {
      user = {
        auth: false
      };
    }, 5000);
  });
  res.send();
};