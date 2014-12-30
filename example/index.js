'use strict';
var DoQmentDB  = require('..');
var CONFIG     = require('../config');
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, CONFIG.DB);
var users = db.use('users');
users.schema({
  name: {
    type: String,
    regex: /^[a-zA-Z0-9|/d]{3,}$/,
    expose: true
  },
  phone: {
    type: Number,
    regex: /^[a-zA-Z0-9|/d]{3,}$/,
    expose: true
  }
});

users.find({})
  .then(console.log)
//
//users.create({ name: 'fo2', phone: 2113 })
//  .then(console.log)
//  .catch(console.log)