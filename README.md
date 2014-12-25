##DoQmentDB - A Promise-Based DocumentDB Client 
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
> DoQmentDB is a tiny layer that provides the simplicity of MongoDB for DocumentDB users.

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
// Create DocumentDB connection
var connection = new (require('documentdb').DocumentClient)(HOST, OPTIONS);
// Pass connection and database-name, if `test` is not exist it will create one.
var db = new DoQmentDB(connection, 'test');
// Create a CollectionManager instance, if `users` is not exist it will create one.
var users = db.use('users');

// Each http function returns a `Promise` with two specific methods: success and error.
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
**Note:** to return all documents, omit params argument or pass an empty object({}).  
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
##find
get object properties and return array of results.  
**Usage:** `users.find(object)`  
**Note:** to return all collections, omit params argument or pass an empty object({}).  
**Returns:** `Array`
```js
users.find({ active: true })
  .then(console.log);
```
##findOne
get object properties and return the first matching result.  
**Usage:** `users.findOne(object)`  
**Returns:** `Object`
```js
users.findOne({ active: true, name: 'Bar' })
  .then(console.log);
```
##findById
find document by giving a `string` id.  
**Usage:** `users.findById(string)`  
**Returns:** `Object`
```js
users.findById('53...3')
  .then(console.log);
```
##findAndRemove
get object properties to search, find the equivalents and remove them.  
**Usage:** `users.findAndRemove(object)`  
**Returns:** `Array`
```js
users.findAndRemove({ name: 'Ariel' })
  .then(console.log);

// Remove all users
users.findAndRemove({})
  .then(console.log);
```
##findOneAndRemove
get object properties, and remove the first matching result.  
**Usage:** `users.findOneAndRemove(object)`  
**Returns:** `undefined` or `Boolean`
```js
users.findOneAndRemove({ name: 'Ariel', admin: true })
  .then(console.log);
```
##findAndModify
get object properties to search, find the equivalents and modify them(`extend` operation).  
**Usage:** `users.findAndModify(object, extend)`  
**Aliases:** `update`  
**Returns:** `Array`
```js
users.update({ name: 'Ariel', admin: true }, { admin: false })
  .then(console.log);
```
##findOneAndModify
get object properties and modify(`extend` operation) the first matching.  
**Usage:** `users.findOneAndModify(object, extend)`  
**Returns:** `Object`
```js
users.findOneAndModify({ admin: false }, { admin: true })
  .then(console.log);
```
##findOrCreate
get object properties, search for document, if it not exist create one.  
**Usage:** `users.findOrCreate(object)`    
**Returns:** `Object`
```js
users.findOrCreate({ admin: false, name: 'Ariel' })
  .then(console.log);
```

[npm-image]: https://img.shields.io/npm/v/doqmentdb.svg?style=flat-square
[npm-url]: https://npmjs.org/package/doqmentdb
[travis-image]: https://img.shields.io/travis/a8m/doqmentdb.svg?style=flat-square
[travis-url]: https://travis-ci.org/a8m/doqmentdb
[coveralls-image]: https://img.shields.io/coveralls/a8m/doqmentdb.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/a8m/doqmentdb
[david-image]: http://img.shields.io/david/a8m/doqmentdb.svg?style=flat-square
[david-url]: https://david-dm.org/a8m/doqmentdb
[license-image]: http://img.shields.io/npm/l/doqmentdb.svg?style=flat-square
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/doqmentdb.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/doqmentdb
