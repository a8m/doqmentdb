'use strict';
// This file it's kind of draft to the new Design of what I'm gonna
// refactor this project, cuz I really don't like current

// Connection + db usage
var dbConnection = new (require('documentdb').DocumentClient)('host', 'foo:9090');
var DoQmentDB = require('..');
var db = new DoQmentDB(dbConnection, 'databaseName');

// Collection + query docs
var users = db.get('users'); //get or use
users.find({ id: 2 });






// Implementation ideas
function DB() {

}

DB.prototype.use = function(name) {
  this.dbName = name;
};