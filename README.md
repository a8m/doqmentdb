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
// Create a CollectionManager instance, if `users` is not exist it will create one.
var users = db.use('users');

// Each http function returns a Promise with two specific methods: success and error.
users.create({ name: '6534' })
  .then(console.log);
  
users.findById(1)
  .then(console.log);

users.findAndRemove({ isAdmin: false })
  .then(console.log);
```
#Database
Create a DatabaseManager by passing `connection` and `databaseName`.
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
**Returns:** `Object`
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
##find
find collection by given object params.  
**Note:** to return all collections, omit params argument or pass an empty object({}).  
**Usage:** `db.find(object[optional])`  
**Returns:** `Array`
```js
db.find()
  .then(console.log); // Return all collections
  
db.find({ id: 'users' })
  .then(console.log); // Return collections where id equal to `users`
```
##findById
find collection by given `string` id.  
**Usage:** `db.findById(string)`  
**Returns:** `Object`
```js
db.findById('users')
  .then(console.log);
```
##findOrCreate
get object properties, search for collection, if it not exist create one.  
**Usage:** `db.findOrCreate(object)`  
**Returns:** `Object`
```js
db.findOrCreate({ name: 'users', id: '#1' })
  .then(console.log);
```
##remove
get collection id as a `String`, if it exist - remove it and return `undefined`, else return `false`.  
**Usage:** `db.remove(string)`  
**Returns:** `undefined` or `Boolean`
```js
db.remove('test')
  .then(console.log);
```
##use
get collection name and return `CollectionManager` instance.  
**Note:** if the given `collection` is not exist it will create one.  
**Usage:** `var coll = db.use(string);`  
**Returns:** `object` instanceof `CollectionManager`
```js
var users = db.use('users'); // This operation is not async
```
#Collection
Create a CollectionManager by passing to `.use` function a collection name.
```js
var users = db.use('users'); 
console.log(users.constructor.name); // Collection
```
##create
get object properties, and create new document under the used collection.  
**Usage:** `users.create(object)`  
**Aliases:** `insert`  
**Returns:** `Object`
```js
users.create({ name: 'Ariel', admin: true })
  .then(console.log); // { name: 'Ariel', admin: true, id: '8...31', _self: ... }
```
##getCollection
return the used collection.  
**Usage:** `users.getCollection()`
```js
users.getCollection()
  .then(console.log);
```
