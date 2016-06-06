/**
 * Created by The Boss on 01/06/2016.
 */
var express = require('express');
var app = express();
var server;
var router = express.Router();
var bunyan = require('bunyan');

var clinicController = require('./controllers/clinic');

var environment = process.env.NODE_ENV || 'development';

var serverLog = bunyan.createLogger({
    name: 'Sainsburys Clinics Server Log',
    serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res
    },
    streams: [{
        path: 'server_log.log'
    }]
});

// Create endpoint handlers for /ping
router.route('/ping')
    .get(clinicController.getPing);

// Create endpoint handlers for healthcheck
router.route('/healthcheck')
    .get(clinicController.getHealthCheck);

// Create endpoint handlers for /postcode/:postcode
router.route('/clinics/postcode/:postcode')
    .get(clinicController.getByPostcode);

// Create endpoint handlers for /name/:name
router.route('/clinics/name/:name')
    .get(clinicController.getByName);

// Create endpoint handlers for /city/:name
router.route('/clinics/city/:name')
    .get(clinicController.getByCity);


app.use('/', router);

//Error Log
app.use(function(err, req, res, next) {
    serverLog.error({ req: req }, "Server Error:" + err);
    if(environment === 'development')
        res.status(500)
            .send(err);
    else
        res.status(500).send();
});

//Not found
app.use(function(req, res, next) {
    serverLog.info({ req: req }, "Clinics: User Req Not Found.");
    res.status(404).send();
});


var start = exports.start = function(port, callback){
    server = app.listen(port, callback);
};

var stop = exports.stop = function(callback){
    server.close(callback);
};
