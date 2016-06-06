/**
 * Created by The Boss on 01/06/2016.
 */
var request = require('request');
var bunyan = require('bunyan');

var environment = process.env.NODE_ENV || 'development';

var errorLog = bunyan.createLogger({
    name: 'Sainsburys Clinics Errors',
    serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res
    },
    streams: [{
        path: 'error_log.log'
    }]
});

var eventLog = bunyan.createLogger({
    name: 'Sainsburys Clinics Events',
    serializers: {
        req: bunyan.stdSerializers.req,
        res: bunyan.stdSerializers.res
    },
    streams: [{
        path: 'event_log.log'
    }]
});

const CLINICS_POSTCODE = 'http://data.gov.uk/data/api/service/health/clinics/partial_postcode?partial_postcode=';
const CLINICS_NAME = 'http://data.gov.uk/data/api/service/health/clinics/organisation_name?organisation_name=';
const CLINICS_CITY = 'http://data.gov.uk/data/api/service/health/clinics?city=';


/**
 * Create endpoint /clinics/postcode for GET
 */
exports.getByPostcode = function(req, res) {
    
    if (!req.params.postcode || !isValidPostcode(req.params.postcode)) {

        grabError(
            {
                Error: "Empty or invalid postcode.",
                message: "Respect the space. Ex: SW11 4LU"
            },
            "Clinics: User invalid input Postcode.",
            res
        );

    }else{

        eventLog.info({ req: req }, "Clinics: User Req Postcode.");
        var areaPostcode = req.params.postcode.toUpperCase();

        request.get({ url: CLINICS_POSTCODE + areaPostcode.split(" ")[0] }, function(error, response, body) {

            if (!error && response.statusCode == 200) {
                let clinics_data = JSON.parse(body);

                let cl_data = clinics_data.result
                    .filter(function(clinic){

                        if(clinic.postcode === areaPostcode){
                            clinic.formatted = formattedClinic(clinic);
                            return clinic;
                        }
                });

                eventLog.info({ req: request }, "Clinics: Server Req Postcode.");

                res.json(cl_data);

            }else{

                grabError(
                    {
                        Error: error,
                        message: "getaddrinfo ENOTFOUND datytfya.gov.uk datytfya.gov.uk:80"
                    },
                    "Clinics: Server getaddrinfo ENOTFOUND for Postcode.",
                    res
                );

            }
        });

    }
};


/**
 * Create endpoint /clinics/name for GET
 */
exports.getByName = function(req, res) {

    if (!req.params.name) {

        grabError(
            {
                Error: "Empty or invalid name.",
                message: "Invalid name. Ex: eye clinic"
            },
            "Clinics: User invalid input Name.",
            res
        );

    }else{

        eventLog.info({ req: req }, "Clinics: User Req Name.");
        let clinicName = req.params.name;

        request.get({ url: CLINICS_NAME + clinicName }, function(error, response, body) {

            if (!error && response.statusCode == 200) {
                let clinics_data = JSON.parse(body);

                var pims_managed = 0;

                clinics_data.result.forEach(function(clinic){
                    if(clinic.is_pims_managed) pims_managed++;

                    clinic.formatted = formattedClinic(clinic);
                });

                eventLog.info({ req: request }, "Clinics: Server Req Name.");

                res.json({
                    result: clinics_data.result,
                    pims_managed: pims_managed
                });

            }else{

                grabError(
                    {
                        Error: error,
                        message: "getaddrinfo ENOTFOUND datytfya.gov.uk datytfya.gov.uk:80"
                    },
                    "Clinics: Server getaddrinfo ENOTFOUND for Name.",
                    res
                );
            }
        });
    }
};


/**
 * Create endpoint /clinics/city for GET
 */
exports.getByCity = function(req, res) {

    if (!req.params.name) {

        grabError(
            {
                Error: "Empty or invalid city.",
                message: "Invalid city. Ex: London"
            },
            "Clinics: User invalid input City.",
            res
        );

    }else{

        eventLog.info({ req: req }, "Clinics: User Req City.");
        let clinicCity = req.params.name;

        request.get({ url: CLINICS_CITY + clinicCity }, function(error, response, body) {

            if (!error && response.statusCode == 200) {

                let clinics_data = JSON.parse(body);
                let totalClinics = clinics_data.result.length;
                var postCodes = {};

                clinics_data.result.forEach(function(c){

                    postCodes[c.partial_postcode] =
                    (postCodes[c.partial_postcode] !== undefined) ?
                        (postCodes[c.partial_postcode] + 1) : 1;
                });

                eventLog.info({ req: request }, "Clinics: Server Req City.");

                res.json({
                    result: postCodes,
                    total: totalClinics
                });

            }else{

                grabError(
                    {
                        Error: error,
                        message: "getaddrinfo ENOTFOUND datytfya.gov.uk datytfya.gov.uk:80"
                    },
                    "Clinics: Server getaddrinfo ENOTFOUND for City.",
                    res
                );
            }
        });
    }
};

/**
 * Create endpoint /healthcheck for GET
 */
exports.getHealthCheck = function(req, res) {

    var healthChecksSites = [
        CLINICS_POSTCODE,
        CLINICS_NAME,
        CLINICS_CITY
    ];

    eventLog.info({ req: request }, "Health: Server Checking health services.");

    healthCheck(healthChecksSites, true, [], res);
};


/**
 * Create endpoint /ping for GET
 */
exports.getPing = function(req, res) {

    eventLog.info({ req: request }, "User Ping.");
    res.status(200).send();
};


/**
 * Recursive function to check the health of the services
 *
 * @param healthChecks  API Endpoints
 * @param isHealthy     Check for all endpoints ok
 * @param result        Exam Result
 * @param res           Response to return all values
 */
var healthCheck = function(healthChecks, isHealthy, result, res){

    if(healthChecks.length > 0){

        var service = healthChecks.shift();
        var start = process.hrtime();

        request.get({ url: service }, function(error, response, body) {

            let diff = process.hrtime(start);
            let resp_time = Math.trunc(diff[0]*1e3 + diff[1]/1e6);

            let isHealthyService = false;
            let message = "";
            let service_name = service.slice(0, service.indexOf("?"));

            if (error || response.statusCode != 200) {
                isHealthy = false;
                message = "request to\n" + service_name +
                    "failed, reason: getaddrinfo ENOTFOUND datytfya.gov.uk datytfya.gov.uk:80";
            }

            result.push({
                service: service_name,
                isHealthy: isHealthyService,
                message: message,
                time: resp_time
            });

            healthCheck(healthChecks, isHealthy, result, res);
        });

    }else{

        res.json({
            isHealthy: isHealthy,
            healthChecks: result
        });

    }
};

/**
 * Returns a String formatted with the next details:
 *
 *  - name ( address1, address2, address3, postcode, city )
 *
 * @param clinic object
 * @returns String
 */
var formattedClinic = function(clinic){

    var {
        organisation_name,
        address1,
        address2,
        address3,
        postcode,
        city,
    } = clinic;

    return organisation_name + " (" +
        (address1 != "" ? address1 + ", " : "") +
        (address2 != "" ? address2 + ", " : "") +
        (address3 != "" ? address3 + ", " : "") +
        postcode + ", " +
        city + ")"
        ;
};

/**
 * Tests to see if string is in correct UK style postcode: AL1 1AB, BM1 5YZ etc.
 *
 * Extracted from uk goverment and stackoverflow discussion:
 * http://webarchive.nationalarchives.gov.uk/+/http://www.cabinetoffice.gov.uk/media/291370/bs7666-v2-0-xsd-PostCodeType.htm
 * http://stackoverflow.com/questions/164979/uk-postcode-regex-comprehensive
 * var postcodeRegEx = /[A-Z]{1,2}[A-Z0-9]{1,2} ?[0-9][A-Z]{2}/i; //Simple Example
 *
 * @param p postcode - string
 * @returns Boolean
 */
var isValidPostcode = function(p) {
    var postcodeRegEx = /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW])\s ?[0-9][ABD-HJLNP-UW-Z]{2})$/;
    return postcodeRegEx.test(p);
};

/**
 * Record Error Log and Send to the User
 * @param msg_user
 * @param msg_log
 * @param res
 */
var grabError = function(msg_user, msg_log, res){
    errorLog.error({ req: req }, msg_log);

    if(environment === 'development')
        res.status(500)
            .send(msg_user);
    else
        res.status(500).send();
};
