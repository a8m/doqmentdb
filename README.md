##DoQmentDB - A Promise-Based DocumentDB Client
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]
> DoQmentDB is a tiny layer that provides the simplicity of MongoDB for DocumentDB users(support schema, hooks/middleware, atomic-transactions, udf and more).

##Table of contents:
- [![Gitter][gitter-image]][gitter-url]
- [Get Started](#get-started)
- [Examples](#examples-1)
- [Changelog](#changelog)
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
  - [createOrUpdate](#createorupdate)
  - [upsert](#createorupdate)
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
  - [updateOne](#findoneandmodify)
- [Queries](#queries)
- [Operations](#operations)
- [Schema](#schema)
- [Atomic Transactions](#atomic-transactions)
- [Middleware](#middleware)
  - [pre](#pre)
  - [post](#post)

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
// Using schema
users.schema(model);
// Add hooks(see `users` full example)
users.pre('save', function(next) {
  var doc = this;
  doc.createdAt = new Date().toString();
  next();
});

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
##createOrUpdate
create a new document under the current collection, or update an existing document with the same id.  
**Usage:** `users.createOrUpdate(object)`  
**Aliases:** `upsert`  
**Returns:** `Object`
```js
users.upsert({ id: 'my_user_id', admin: true })
  .then(console.log); // { id: 'my_user_id', admin: true, _self: ... }
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
**Note:** if you want support atomic-transactions(**i.e:** do things concurrently, **e.g:** distributed system),
you need use this method prefix with `$` sign.
```js
users.findAndRemove({ name: 'Ariel' })
  .then(console.log);

// Using stored procedure
users.$findAndRemove({ name: 'Ariel' })
  .then(console.log);

// Remove all users
users.findAndRemove({})
  .then(console.log);
```
##findOneAndRemove
get object properties, and remove the first matching result.  
**Usage:** `users.findOneAndRemove(object)`  
**Returns:** `undefined` or `Boolean`  
**Note:** if you want support atomic-transactions(**i.e:** do things concurrently, **e.g:** distributed system),
you need use this method prefix with `$` sign.
```js
users.findOneAndRemove({ name: 'Ariel', admin: true })
  .then(console.log);

// Using stored procedure
users.$findOneAndRemove({ name: 'Ariel', admin: true })
  .then(console.log);
```
##findAndModify
get object properties to search, find the equivalents and modify them(`extend` operation).  
**Usage:** `users.findAndModify(object, extend)`  
**Aliases:** `update`  
**Returns:** `Array`  
**Note:** if you want support atomic-transactions(**i.e:** do things concurrently, **e.g:** distributed system),
you need use this method prefix with `$` sign.
```js
users.update({ name: 'Ariel', admin: true }, { admin: false })
  .then(console.log);

// Push 'a' and 'b' to `list` field(do it concurrently)
['a', 'b'].forEach(function(ch) {
  users.$update({}, { list: { $push: ch } });
});
```
##findOneAndModify
get object properties and modify(`extend` operation) the first matching.  
**Usage:** `users.findOneAndModify(object, extend)`  
**Aliases:** `updateOne`  
**Returns:** `Object`  
**Note:** if you want support atomic-transactions(**i.e:** do things concurrently, **e.g:** distributed system),
you need use this method prefix with `$` sign.
```js
users.findOneAndModify({ admin: false }, { admin: true })
  .then(console.log);

// Using stored procedure
users.$findOneAndModify({ admin: false }, { admin: true })
  .then(console.log);
```
##findOrCreate
get object properties, search for document, if it not exist create one.  
**Usage:** `users.findOrCreate(object)`    
**Returns:** `Object`  
**Note:** if you want support atomic-transactions(**i.e:** do things concurrently, **e.g:** distributed system),
you need use this method prefix with `$` sign.
```js
users.findOrCreate({ admin: false, name: 'Ariel' })
  .then(console.log);

// Using stored procedure
users.$findOrCreate({ admin: false, name: 'Ariel' })
  .then(console.log);
```

#Queries
###Operators
* Logical & Conjunctive:
  * `$or` OR
  * `$and` AND
  * `$not` NOT
  * `$nor` NOT(... OR ...)
* Comparison:
  * `$gt` >
  * `$gte` >=
  * `$lt` <
  * `$lte` <=
  * `$ne` <> or !=
* UDF:
  * `$in` like `Array.prototype.some(...)`
  * `$all` like `Array.prototype.every(...)`
  * `$type` `typeof value`
  * `$regex` `new RegExp(...).test(value)`
  * `$size` test `array.length`

###Examples
```js
users.find({ a: 1, b: 2, c: '3' })
// ... r WHERE r.a=1 AND r.b=2 AND r.c="3"

users.find({ $or: [{ a: 2, b: 3}, { c: 3 }] })
// ... r WHERE ((r.a=2 AND r.b=3) OR r.c=3)

users.find({ $not: { a: 1, b: 2, c: 3 } })
// ... r WHERE NOT(r.a=1 AND r.b=2 AND r.c=3)

users.find({ $nor: [ { a: 1 }, { b: 3 }]})
// ... r WHERE NOT(r.a=1 OR r.b=3)

users.find({ $nor: [ { a: 1, b: 1 }, { c: 3 } ] })
// ... r WHERE NOT((r.a=1 AND r.b=1) OR r.c=3)

users.find({ $not: { name: { $gt: 3 }, age: 12 } })
// ... r WHERE NOT(r.name > 3 AND r.age=12)

users.find({ $not: { name: { $ne: 'bar' } } })
// ... r WHERE NOT(r.name <> "bar")

users.find({ $or: [
        { name: { $ne: 'Ariel' } },
        { age: { $lte: 26 } },
        { $and: [
          { isAdmin: { $ne: false } },
          { isUser: { $ne: false } }
        ]}
      ]})
// ... r WHERE r.name <> "Ariel" OR r.age <= 26 OR (r.isAdmin <> false AND r.isUser <> false)

users.find({ coins: { $in: 2 } })
// ... r WHERE inUDF(r.coins, 2)

users.find({ $not: { age: { $type: 'number' } } })
// ... r WHERE NOT(typeUDF(r.age, "number"))
```

#Operations
When using one of the update operations(**e.g:** `.update()`, `.findAndModify()`, etc...), you could use the build-in `prototype` functions(based on the type) prefixing with `$` sign.  
**Usage:** `users.update({ ... }, { keyName: { $method: value } })`  
**Note:** value could be single or array of arguments.
```js
// Find all, and push 2 to `arr` field
users.update({}, { arr: { $push: 2 } });

// Suffix all users `name` with #
users.update({}, { name: { $concat: '#' } });

// Trim the name from `foo` to `o`
users.update({  name: 'foo' }, { name: { $substr: [1,1] } });
```

#Schema
Manage your documents with schema.  
**fields:**
* `type`
  *  ***required***
  *  used for type comparing, (e.g: `String`, `Boolean`, `Number`, etc..).
* `default`
  * ***optional***
  * value fallback
* `regex`
  * ***optional***
  * regex validation, (e.g: email validation - `/^[a-zA-Z0-9@:%_\+.~#?&//=|/d]{10,}$/`).
* `error`
  * ***optional***
  * return message to fields that fail in the validation phase(`regex`/`type`). see: [example](https://github.com/a8m/doqmentdb/tree/master/example/odm)
* `expose`
  * ***optional***
  * `expose` by default is `true`, unless you set it to `false`, it's means that all the `find` operations returns the documents without exposing this fields. see: [example](https://github.com/a8m/doqmentdb/blob/master/example/users/model/users/schema.js#L42)

**Example using schema:**  
schema: `model.js`
```js
module.exports = {
  /**
   * @field name
   * @default no default value
   */
  name: {
    type: String,
    'default': ''
  },

  /**
   * @field email
   * @default no default value
   * @regex email, min-length = 10
   */
  email: {
    type: String,
    'default': '',
    regex: /^[a-zA-Z0-9@:%_\+.~#?&//=|/d]{10,}$/,
    error: '`email` must be type string, valid email address, and least 10 chars',
    expose: true
  },

  /**
   * @field password
   * @default no default value
   * @regex password
   */
  password: {
    type: String,
    'default': '',
    regex: /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/,
    error: '`password` must be type string, contain 8 chars and at least one number, ' +
      'one letter and one unique character such as !#$%&? "',
    expose: false
  },

  /**
   * @field isAdmin
   * @default false
   */
  isAdmin: {
    type: Boolean,
    'default': false
  }
};
```
using schema(`model.js`)
```js
var DoQmentDB  = require('doqmentdb');          
var model      = require('./model');            // Get model/schema
var connection = new (require('documentdb')     // Create DocumentDB connection
.DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

var db = new DoQmentDB(connection, CONFIG.DB);  // Create DBManager 'test'
var users = db.use('users');                    // Create CollectionManager 'users'
users.schema(model);                            // Using schema

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
```
see: [How to architect your models](https://github.com/a8m/doqmentdb/tree/master/example/users/model)

#Middleware
Middleware/Hooks are executed at the document level(`create`/`save`/`insert`, `update`, `remove/delete`).  
There are two types of middleware, **pre** and **post**.  

##pre
**Usage:** `users.pre(operation, callback)`  
**Note:** `pre` middleware are executed one after another, when each middleware calls next.  
**Example:**
```js
users.pre('save', function(next) {
  var doc = this;
  doc.createdAt = new Date().toString();
  next();
}, function(next) {
  var doc = this;
  doc.updatedAt = new Date().toString();
  next();
});

// Do something async
users.pre('save', function(next) {
  var doc = this;
  bcrypt.genSalt(10, function(err, salt) {
    bcrypt.hash(doc.password, salt, function(err, hash) {
      doc.password = hash;
      next();
    });
  });
});
// ##Note: the order is importatnt, this example order:
// `createdAt()`, `updatedAT()`, `hash/bcrypt()`, and then the `.create` operation will called
```
##post
**Usage:** `users.post(operation, callback)`  
**Note:** `post` middleware are executed in parallel.  
**Example:**
```js
users.post('save', function(doc) {
  logger(new Date(), doc, 'saved!')
});
```
#Atomic Transactions
Since **v0.2.6** DoQmentDB supports atomic-transactions using a built-in sporcs(i.e: stored procedures) to handle concurrently well.  
**Note:** To perform some operation this way, you should prefix it with `$`.  
**Read More:** [DocumentDB - Atomic Transactions](https://github.com/Azure/azure-content/blob/master/articles/documentdb-programming.md#introduction)
```js
// Lets take some example of `consuming` from two differents
// Service-Bus queues and update the same `model`/`document`
//
// Note: This also could happen in a distributed system, when two operations happens in parallel

// We have a `stores` collection that holds the `sales` and the `users`
// fields per `store`(a Document)
// We are using the `atomic` version of `update`, because we don't want to lose data
sbs.receiveQueueMessage('sales', function(msg) {
  stores.$update({ id: msg.id }, { sales: { $push: msg.sale } });
  // Polling again...
});

sbs.receiveQueueMessage('users', function(msg) {
  stores.$update({ id: msg.id }, { users: { $push: msg.user } });
  // ...
});
```

#Examples
* [Koa DocumentDB Example](https://github.com/a8m/koa-documentdb-example) - A users CRUD application using Koa and DocumentDB.
* [Express DocumentDB Example](https://github.com/a8m/doqmentdb/tree/master/example/users) - Express application using DocumentDB.

#Changelog
##0.2.9
* Schema Fix- issue #26

##0.2.8
* Add aliases: `updateOne` and `$updateOne`(the conccurent one)
* refactor the built-in stored procedure(`findAndModify`)

##0.2.6
Since **0.2.6** DoQmentDB support atomic transactions using `DocumentDB stored procedures`.  
Methods that support:
 * `update`/`findAndModify`
 * `findOneAndModify`
 * `findOrCreate`
 * `findAndRemove`
 * `findOneAndRemove`

If you want to use one of this methods, you should use them prefix with `$` sign.
```js
// Push 'a' and 'b' to `list` field(do it concurrently)
['a', 'b'].forEach(function(ch) {
  users.$update({}, { list: { $push: ch } });
});
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
[gitter-image]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/a8m/doqmentdb?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge
