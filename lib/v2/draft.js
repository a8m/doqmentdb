'use strict';
// This file it's kind of draft to the new Design of what I'm gonna
// refactor this project, cuz I really don't like current
var DoQmentDB = require('./');
// Connection + db usage
var CONFIG = require('../../config');
var dbConnection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);
var db = new DoQmentDB(dbConnection, 'compliance-proxy');
//
//// Collection + query docs
var users = db.use('users'); //get or use


//users.find({ id: 'ariel' })
//  .then(console.log)

//users.findById('ariel')
//  .then(console.log)

//users.findAndRemove({name: 'foo'})
//  .then(console.log)

users
  .create({ id: '299', name: 'Ariel' })
  .then(console.log)