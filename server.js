'use strict'

const hapi = require('hapi');
const boom = require('boom');
const mongoose = require('mongoose');
const glob = require('glob');
const path = require('path');
const config = require('./config');

const server = new hapi.Server();

// The connection object takes some
// configuration, including the port
server.connection({ port: 5000, routes: { cors: true } });

const dbUrl = 'mongodb://localhost:27017/homestay-data';

server.register(require('hapi-auth-jwt'), err => {
    // We are giving the strategy a name of 'jwt'
    server.auth.strategy('jwt', 'jwt', 'required', {
      key: config.authkey,
      verifyOptions: { algorithms: ['HS256'] }
    });
  
    // Look through the routes in
    // all the subdirectories of API
    // and create a new route for each
    glob.sync('api/routes/*.routes.js', {
        root: __dirname
    })
    .forEach(file => {
        const route = require(path.join(__dirname, file));
        server.route(route);
    });
});

const init = async () => {
    await server.start();
    mongoose.Promise = require('bluebird');
    mongoose.connect(dbUrl, {useMongoClient : true}, err => {
        if (err) {
            throw err;
        }
    });
    console.log(`Server running at: ${server.info.uri}`);
};

init();