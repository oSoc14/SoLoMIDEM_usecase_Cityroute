/* Dependencies */
var dbServer = require('../server');
var users = dbServer.db.collection('users');

var userDefault = {
    auth: false
  },
  user = userDefault;

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

  dbServer.io.sockets.emit('msg', {
    user: {
      auth: true
    }
  });

  users.findOne({}, function(err, doc) {
    if (err) console.log(err);
    console.log('send to client');
    doc.auth = true;
    user = doc;
    dbServer.io.sockets.emit('msg', {
      user: doc
    });

    setTimeout(function() {
      user = userDefault;
    }, 5000);
  });
};

