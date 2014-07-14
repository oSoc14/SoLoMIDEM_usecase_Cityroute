'use strict';
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

var WS = null;
var user = {
  auth: false
};
var authFirst = true;
var prevPage = 'none';

/**
 * Load iframe with authorization server
 */
function loadIframe(page) {
  if (prevPage === page) return;
  prevPage = page;
  console.log('Iframe for ' + page);
  var $loginIframe = $('#login iframe');
  if (page === false) {
    $loginIframe.attr('src', '');
  } else {
    $loginIframe.attr('src', config.auth.address + '/' + page);
  }
}

/**
 * Load iframe with authorization server
 */
function onLogin(data) {
  console.log('onLogin before + after');
  console.log(user);
  if (data) {
    $.each(data, function(index, value) {
      user[index] = value;
    });
  }
  console.log(user);
  if (data === false) {
    loadIframe('logout.php');
    changeView('login');
  } else if (user.auth === true) {
    changeView('account');
    loadIframe(false);
  } else {
    loadIframe('index.php');
    changeView('login');
  }
  $('body').toggleClass('user-auth', !!user.auth);
  $('body').toggleClass('user-irail', !!user.irail);
  $('body').toggleClass('user-citylife', !!user.citylife);
  $('body').toggleClass('user-no-auth', !user.auth);
  $('body').toggleClass('user-no-irail', !user.irail);
  $('body').toggleClass('user-no-citylife', !user.citylife);
  if (user.citylife) {
    $('#citylife-name').text(user.citylife.first_name);
    $('#citylife-id').text(user.citylife.id);
  }
  $('#user-data').html(JSON.stringify(user, undefined, 2));
}

/**
 * Log out
 */
function logOut() {
  onLogin(null);
  console.log('Logout initiated in iframe');
}

/**
 * Connect to CityLife
 */
function connectCityLife() {
  $('#modalCityLife').modal('hide');

  var username = $('#citylife-username').val();
  var password = $('#citylife-password').val();

  var data = {
    'username': username,
    'password': password
  };

  console.log(config.server.address + '/users/login/');

  $.ajax({
    url: config.server.address + '/users/login/',
    data: data,
    dataType: 'json',
    type: 'POST',
    success: onConnectedCityLife,
    error: function(jqXHR, errorstatus, errorthrown) {
      alertify.error('Link mislukt');
      console.log('onConnectError: ' + errorstatus + ' -- ' + jqXHR.responseText);
    }
  });
}

/**
 * On successful connection to CityLife
 */
function onConnectedCityLife(data) {
  alertify.success('CityLife is nu gelinkt!');
  user.citylife = data.response;
  onLogin();
}

/**
 * Connect to iRail
 */
function connectIrail() {
  if (!config || !config.irail) {
    console.log('iRail configuration missing');
  } else if (!user || !user._id) {
    console.log('user._id not found');
  } else {
    console.log('Redirecting to iRail!');
    window.location = config.irail + '/authorize?client_id=testclient&response_type=code&state=' + user._id;
  }
  return false;
}
