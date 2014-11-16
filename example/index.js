'use strict';
var DoQumentDB = require('..');
var Promise    = require('bluebird');
var DB_CONFIG  = require('../config'); //add your config

DoQumentDB.createConnection(DB_CONFIG.HOST, DB_CONFIG.OPTIONS);

//...