/* Dependencies */
var dbServer = require('../server');
var users = dbServer.db.collection('users');

var userDefault = {
    auth: false
  },
  user = userDefault;

exports.onConnection = function(socket) {
  if (!socket) return;
  console.log('hello!');

  socket.emit('msg', {
    user: user
  });
  socket.on('msg', function(data) {
    console.log('got msg from server');
    console.log(data);
  });
  socket.on('unset', function(data) {
    console.log('unset information');
    var userid = data.userid;
    var field = data.field;

    user[field] = null;

    users.update({
      _id: userid
    }, {
      $unset: {
        citylife: (field === 'citylife' ? 1 : 0),
        irail: (field === 'irail' ? 1 : 0)
      }
    }, function(err, doc) {
      socket.emit('msg', {
        user: user
      })
    });
  });
  socket.on('set', function(data) {
    console.log('set information');
    var userid = data.userid;

    user[data.key] = data.value;

    var info = {};
    info[data.key] = data.value;

    users.update({
      _id: userid
    }, {
      $set: info
    }, function(err, doc) {
      socket.emit('msg', {
        user: user
      })
    });
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

    res.send('Authorization successful');
  });
};

exports.onConnectIrail = function(req, res) {
  console.log('iRail connect received by node');
  var userid = req.query.state;
  var code = req.query.code;

  // state is the user._id
  // it was sent together with the token request in connectIrail()
  users.update({
    _id: userid
  }, {
    $set: {
      irail: {
        code: code
      }
    }
  }, function(err, doc) {
    if (err) console.log(err);

    users.findOne({
      _id: userid
    }, function(err, doc) {
      if (err) console.log(err);
      console.log('redirect');
      if (doc) {
        doc.auth = true;
      } else {
        doc = {
          auth: false
        }
      }
      user = doc;
      res.redirect('/');
    });

  });
};
