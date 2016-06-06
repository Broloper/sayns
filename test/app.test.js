/**
 * Created by The Boss on 01/06/2016.
 */
var expect = require('chai').expect;
var request = require('superagent');
var myApp = require('../lib/app');

describe('test suite Sainsburys micro service', function(){

    var port = 8080;
    var baseUrl = 'http://localhost:' + port;

    before(function(done){
        myApp.start(port, done);
    });

    after(function(done){
        myApp.stop(done);
    });

    describe('when test /ping route', function(){

        it('Should check ping endpoint works', function(done){
            request.get(baseUrl + '/ping').end(function(err, res){
                expect(err).not.to.be.ok;
                expect(res).to.have.property('status', 200);
                expect(res.text).to.equal('');
                done();
            });
        }) ;
    });

    describe('when test /healthcheck route', function(){

        it('Should check healthcheck endpoint works', function(done){
            request.get(baseUrl + '/healthcheck').end(function(err, res){
                expect(err).not.to.be.ok;
                expect(res).to.have.property('status', 200);
                expect(res).to.be.json;
                expect(res.body).to.have.property('isHealthy');
                expect(res.body).to.have.property('healthChecks');
                expect(res.body.isHealthy).to.be.ok;
                done();
            });
        }) ;
    });

    describe('when test /clinics/postcode/:postcode route', function(){

        it('Should check proper postcode works', function(done){
            request.get(baseUrl + '/clinics/postcode/SW11 4LU').end(function(err, res){
                expect(err).not.to.be.ok;
                expect(res).to.have.property('status', 200);
                expect(res).to.be.json;
                done();
            });
        }) ;

        it('Should check invalid postcode without space fail', function(done){
            request.get(baseUrl + '/clinics/postcode/SW114LU').end(function(err, res){
                expect(err).to.be.ok;
                expect(res).to.have.property('status', 500);
                done();
            });
        }) ;

        it('Should check invalid postcode fail', function(done){
            request.get(baseUrl + '/clinics/postcode/SW11').end(function(err, res){
                expect(err).to.be.ok;
                expect(res).to.have.property('status', 500);
                done();
            });
        }) ;
    });

    describe('when test /clinics/name/:name route', function(){

        it('Should check end point name works', function(done){
            request.get(baseUrl + '/clinics/name/eye clinic').end(function(err, res){
                expect(err).not.to.be.ok;
                expect(res).to.have.property('status', 200);
                expect(res).to.be.json;
                expect(res.body).to.have.property('pims_managed');
                expect(res.body).to.have.property('result');
                done();
            });
        }) ;

    });

    describe('when test /clinics/city/:name route', function(){

        it('Should check proper end point city works', function(done){
            request.get(baseUrl + '/clinics/city/London').end(function(err, res){
                expect(err).not.to.be.ok;
                expect(res).to.have.property('status', 200);
                expect(res).to.be.json;
                expect(res.body).to.have.property('total');
                expect(res.body).to.have.property('result');
                done();
            });
        }) ;

    });
});