CityRoute
=========

### [Demo on Heroku][1]

## API Docs

This is the [CityRoute API][2].
It includes both the back-end and a front-end responsive website for demo purposes.

## Requirements

### PHP

Both nginx and Apache should work. By default on port 8889.

Set the root directory to

    /path/to/cityroute/linkid

### Node.js

By default on port 8888.

Some packages are included this repository. Sorry.

Others can be installed like this:

    npm install -g bower
    npm install
    bower install

The GoogleMaps package is included in the lib folder due to some changes to its source code.

A MongoDB database is needed but there is no database seed available at the moment.

## Configuration

Create the following files, examples are available in the same directory.

    # solomID config
    ./config/config.php
    # CityRoute serverside config
    ./config/config.js
    # CityRoute clientside config
    ./clientpage/config/config.js

## Run

Start your MongoDB database and then start the server with the following command:

    cd /path/to/cityroute/
    npm start

  [1]: http://cityroute.herokuapp.com
  [2]: https://github.com/oSoc14/SoLoMIDEM_usecase_Cityroute/blob/develop/CityRoute%20API.md
