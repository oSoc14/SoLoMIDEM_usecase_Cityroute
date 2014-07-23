/* Private server-side config */
exports.config = {
  "citylife": {
    "auth": "https://id.citylife.be/auth/token/",
    "deauth": "https://vikingspots.com/en/api/4/basics/logout/",
    "discover": "https://vikingspots.com/citylife/channels/discover/",
    "items": "https://vikingspots.com/citylife/items/",
    "spots": "https://vikingspots.com/citylife/spots/",
    "checkins": "https://vikingspots.com/citylife/checkins/"
  },
  "irail": {
    "request": "http://test.uitid.be/culturefeed/rest/requestToken",
    "access": "http://test.uitid.be/culturefeed/rest/accessToken"
  },
  "db": {
    "name": "CityRoute",
    "url": "mongodb://localhost:27017",
    "secret": "",
    "collections": ["groups", "routes", "messages", "uitids", "users"]
  }
};