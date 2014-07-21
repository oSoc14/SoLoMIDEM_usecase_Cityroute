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
 "auth": true,
 "_id": "8ce8598a-817e-41c1-bb16-2b23458c5be1",
 "user_data": {
   "profile_familyName": "De Wilde",
   "profile_givenName": "michiel",
   "profile_email_address": "mich.dewild@gmail.com",
   "profile_email_confirmed": true
 },
 "citylife": {
   "url": "https://vikingspots.com/citylife/profiles/10004893/",
   "id": 10004893,
   "first_name": "Test",
   "last_name": "Person",
   "profile": "https://vikingspots.com/citylife/profiles/10004893/",
   "avatar": null,
   "token": "eyJkYXRhIjogIntcInNjb3BlXCI6IFwidXNlci5iYXNpY1wiLCBcImV4cGlyZXNcIjogXCIyMDE0LTA3LTExVDE5OjAwOjA0LjA3MTM2MSswMDowMFwiLCBcInNhbHRcIjogXCJsWFY0cTQzaW5FaVRcIiwgXCJ1c2VyXCI6IDEwMDA0ODkzLCBcImFwcGxpY2F0aW9uXCI6IDN9IiwgInNpZ25hdHVyZSI6ICJ4RlBRVURMNms0eHYveU9tc1RRY2EwTG9SNHZLaE9aUmxnQ0JXeXZoVUpRUFJadEVucUwzSnZWVXowZ2ExWUs1VWxUb21XSjFaeDhmbEp0cmt2blVlek5DcnRTVG1hVjBFQndmQWR2Q0lkRE0xemFteFRDaE1hMWFBdXl5d0QwQzJDWit4KzhTaXRLS2VOVjI0ejlkemNhSktMODJTcnNFaGtsa0gxV3JLYU9zVHQ3Uk9GR0xzUHVvc1NoUmtqSENLa2Q2TDFia0lCNy9xbCtqaWI5SW5PWjhTSnRJLzB2Ny9JeFNSYXJjSDhvQ3dZWGFTUnU1eklUVGQyZHBOT25DRWQyWnNzaUJBVnU0V1Fqd2V0SjNOSmg4OE93ZUdLQ2Znak1PSFg5Qkt6SGRndGM4Vm4wMmkwTVBCbkkwSjd3L1o0NDJUVmt1OTlwQitxb1lmZmpleXc9PSJ9"
 }
};
/*{
  auth: false
};*/
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
  console.log('onLogin');
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
  $('body').toggleClass('user-auth', !! user.auth);
  $('body').toggleClass('user-irail', !! user.irail);
  $('body').toggleClass('user-citylife', !! user.citylife);
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
 * Connect to CityLife
 */
function onConnectedCityLife(data) {
  alertify.success('CityLife is nu gelinkt!');
  user.citylife = data.response;
  onLogin();
}
