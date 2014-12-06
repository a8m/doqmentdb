##DoQmentDB - A Promise-Based DocumentDB Client [![Build Status](https://travis-ci.org/a8m/doqmentdb.svg?branch=master)](https://travis-ci.org/a8m/doqmentdb) [![Coverage Status](https://coveralls.io/repos/a8m/doqmentdb/badge.png?branch=master)](https://coveralls.io/r/a8m/doqmentdb?branch=master)
> DoQmentDB is a tiny layer that provides the simplicity of MongoDB for DocumentDB users, **v0.0.1**.

##Table of contents:
- [Get Started](#get-started)
- [Database](#database)
  - [create](#create)
  - [insert](#create)
  - [getDatabase](#getdatabase)
  - [find](#find)
  - [findById](#findbyid)
  - [findOrCreate](#findorcreate)
  - [remove](#remove)
  - [use](#use)
- [Collection](#collection)
  - [create](#create-1)
  - [insert](#create-1)
  - [getCollection](#getcollection)
  - [find](#find-1)
  - [findOne](#findone)
  - [findById](#findbyid-1)
  - [findAndRemove](#findandremove)
  - [findOneAndRemove](#findoneandremove)
  - [findAndModify](#findandmodify)
  - [findOneAndModify](#findoneandmodify)
  - [findOrCreate](#findorcreate-1)
  - [update](#findandmodify)

#Get Started
**(1)** You can install **DoQmentDB** using 2 different methods:  
- clone & [build](#developing) this repository
- via **[npm](https://www.npmjs.org/)**: by running `$ npm install doqmentdb` from your terminal

**(2)** Add to your project:  
```js
var DoqmentDB = require('doqmentdb');
```
**(3)** Start Playing with DoqmentDB:
```js
var DoQmentDB  = require('doqmentdb');
var CONFIG     = require('./config');
// Create DocumentDB connection
var connection = new (require('documentdb').DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);
// Pass connection and database-name(<= auto-creating, e.g: `findOrCreate`)
var db = new DoQmentDB(connection, 'test');
// Create a CollectionManager instance, if `users` is not exist it will create one
var users = db.use('users');

users.create({ name: '6534' })
  .then(console.log);
  
users.findById(1)
  .then(console.log);

users.findAndRemove({ isAdmin: false })
  .then(console.log);
```
#Database
Create a databaseManager by passing `connection` and `databaseName`.
```js
var DoQmentDB  = require('doqmentdb');
// Create DocumentDB connection
var connection = new (require('documentdb').DocumentClient)(HOST, OPTIONS);
// if `test` is not exist it will create one
var db = new DoQmentDB(connection, 'test');
```
##create
Get name and crete new collection in the used db.  
**Usage:** `db.create(string)`  
**Aliases:** `insert`
```js
db.create('users')
  .then(console.log);
```
##getDatabase
Return the used database.  
**Usage:** `db.getDatabase()`
```js
db.getDatabase()
  .then(console.log);
```
