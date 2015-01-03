'use strict';
var DoQmentDB  = require('../../..');             // In your real app, use => require('doqmentdb)
var CONFIG     = require('../../../config');      // DocumentDB connection configuration
var connection = new (require('documentdb')       // Create Connection
  .DocumentClient)(CONFIG.HOST, CONFIG.OPTIONS);

/**
 * @description
 * expose DataBaseManager, e.g(`test-db`)
 * @expose
 */
module.exports = new DoQmentDB(connection, CONFIG.DB);