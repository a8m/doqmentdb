'use strict';
var DoQmentDB  = require('..');
var CONFIG     = require('../config');
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, 'test');
var users = db.use('users');

users.create({ name: '6534' })
  .then(console.log);