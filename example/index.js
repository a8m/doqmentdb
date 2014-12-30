'use strict';
var DoQmentDB  = require('..');
var CONFIG     = require('../config');
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, 'compliance-proxy');
var users = db.use('users');
users.schema({
  name: {
    type: String,
    regex: /^[a-zA-Z0-9|/d]{3,}$/,
    expose: true
  }
});


users.create({ name: 'Ar3' })
  .then(console.log);