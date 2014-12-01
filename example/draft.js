'use strict';
var DoQmentDB = require('./../lib/index');
var CONFIG = require('../config');
var dbConnection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(dbConnection, 'test');
var users = db.use('users');

users.create({ id: '6534' })
  .then(console.log);
//users.findOrCreate({ id: '23asds412', name: 'bar' })
//  .then(console.log)

//db.remove('users')
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