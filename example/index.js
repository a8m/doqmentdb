'use strict';
var DoQmentDB  = require('..');
var CONFIG     = require('../config');
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, CONFIG.DB);
var users = db.use('users');

// The order is important
// create/save its the same thing
users.pre('save', function(next) {
  var doc = this;
  console.log('doc', 1);
  next();
}, function(next) {
  // some async thing
  console.log(2);
  setTimeout(next, 3000);
});

// one more..
users.pre('create', function(next) {
  console.log(3);
  next();
});

users.post('save', function(doc) {
  console.log(doc._self);
}, function(doc) {
  // ...
});

users.create({ name: 'Ariel', age: 26 })
  .then(console.log);
