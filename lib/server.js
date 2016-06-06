/**
 * Created by The Boss on 01/06/2016.
 */
var myApp = require('../lib/app');

var port = 8080;

console.log("Sainsburys 'Clinics' micro service running at port: " + port);
myApp.start(port);

