CityRoute
=========

### [Demo on Heroku][1]

## API Docs

This is the [CityRoute API][2].
It includes both the back-end and a front-end responsive website for demo purposes.

## Requirements

A Node.js server with the following packages installed:

* Express.js
* MongoDB
* Mongojs
* Request
* Polyline
* Querystring
* Bower

These can all be installed by just running the following command from the source folder.

    # if not installed
    npm install -g gulp bower

    # currently this repo contains all node modules
    # this command in not needed
    # removing the node modules and configuring the correct dependencies is planned
    npm install
    bower install

The GoogleMaps package is included in the lib folder due to some changes to its source code.

A MongoDB database is needed but there is no database seed available at the moment.

### Optional

* Gulp

## Configuration

Create the following files, examples are available in the same directory.

* ./auth/citylife.js
* ./auth/dbconfig.js
* ./clientpage/js/auth/config.js

Replace the X's and hardcoded strings by correct strings.

## Run in development

Start your MongoDB database and then start the server with the following command:

    gulp

## Run in production

Start your MongoDB database and then start the server with the following command:

    npm start

  [1]: http://cityroute.herokuapp.com
  [2]: https://github.com/oSoc14/SoLoMIDEM_usecase_Cityroute/blob/develop/CityRoute%20API.md
