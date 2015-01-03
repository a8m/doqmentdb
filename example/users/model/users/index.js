'use strict';
var hooks = require('./hooks');   // Get hooks/middleware
var model = require('./schema');  // Get the model schema
var db    = require('../db');     // DataBaseManager
var users = db.use('users');      // Create CollectionManager(`users`)

users.schema(model);              // Use the given model as a schema

// `Create` hooks
users.pre('create', hooks.createdAt,
                    hooks.updatedAt);
users.pre('create', hooks.hash);
users.post('create', hooks.successLog);

// `Update` hooks
users.pre('update', hooks.updatedAt);

/**
 * @exports CollectionManager(`users`)
 */
module.exports = users;