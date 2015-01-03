'use strict';
var DoQmentDB  = require('../..');
var CONFIG     = require('../../config');
var model      = require('./model');
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, CONFIG.DB);
var users = db.use('users');
users.schema(model);

users.create({ password: 'Ar2!as_s'})
  .then(console.log)
  .catch(console.log);
  /*
   [Error:
   `email` must be type string, valid email address, and least 10 chars
   ]
   */

users.create({ name: 'Ariel', email: 'ariel.com', password: 'Ar2!as_s'})
  .then(console.log)
  .catch(console.log);
/*
 [Error:
 `email` must be type string, valid email address, and least 10 chars
 ]
 */

users.create({ name: 'Ariel', email: 'a8m@gm.com', password: 'Ar2!as_s'})
  .then(console.log)
  .catch(console.log);

/*
 {
   name: 'Ariel',
   email: 'a8m@gm.com',
   password: 'Ar2!as_s',
   id: '2eb7...c0',
    ...
 }
 */
users.find({})
  .then(console.log);
/*
 Get all documents but without exposing fields(i.e: omit `password` field)
 */