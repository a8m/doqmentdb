'use strict';
// This file it's kind of draft to the new Design of what I'm gonna
// refactor this project, cuz I really don't like current
var DoQmentDB = require('./');
// Connection + db usage
var CONFIG = require('../config');
var dbConnection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(dbConnection, 'compliance-proxy');
var users = db.use('users');

users.create({ id: '6534' })
  .then(console.log)
//users.findOrCreate({ id: '23asds412', name: 'bar' })
//  .then(console.log)

//db.remove('users')
//  .then(console.log)

//db.remove({ id: 'compliance-proxy2' })
//  .then(console.log)

//
//db.findOrCreate({ id: 'ips_white_list' })
//  .then(console.log);

//// Collection + query docs
//var users = db.use('users');


//users.find({  name: 'Ariel-change' })
//  .then(console.log);

//users.findById('ariel')
//  .then(console.log)

//users.findAndRemove({name: 'foo'})
//  .then(console.log)

//users
//  .findAndModify({ bar: 'foo' }, { bar: 'foo2' })
//  .then(console.log)

//db.getDatabase()
//  .then(console.log)