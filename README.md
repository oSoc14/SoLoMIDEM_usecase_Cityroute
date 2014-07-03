CityRoute
=========

### [Demo on Heroku][1]

## API Docs

This is the CityRoute API.
It includes both the back-end and a front-end responsive website for demo purposes.

## Requirements

A Node.js server with the following packages installed:

* Express.js
* MongoDB
* Mongojs
* Request
* Polyline
* Querystring

These can all be installed by just running the following command from the source folder.

    npm install

The GoogleMaps package is included in the lib folder due to some changes to its source code.

A MongoDB database is needed but there is no database seed available at the moment.

## Configuration

Create the following files, examples are available the directory.

* ./auth/citylife.js
* ./auth/dbconfig.js
* ./clientpage/js/auth/config.js

Replace the X's and hardcoded strings correct strings.

## Run in development

Start your MongoDB database and then start the server with the following command:

    gulp

## Run in production

Start your MongoDB database and then start the server with the following command:

    npm start

  [1]: http://cityroute.herokuapp.com