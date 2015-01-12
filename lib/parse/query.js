'use strict';
var QUERIES = require('./constant').QUERIES;

/**
 * @description
 * formatFilter
 * @example
 *
 *   formatFilter('{0}', 1)                         // '1'
 *   formatFilter('{1}, {0}', 'world', 'Hello')     // 'Hello world'
 *   formatFilter('r.{0} > {1}', 'id', 2)           // 'r.id > 2'
 *   formatFilter('r.{0} = {1}', 'name', '"foo"')   // 'r.name = "foo"'
 *
 * @param input
 * @returns {String}
 */
function formatFilter(input) {
  var args = Array.prototype.slice.call(arguments, 1);

  return input.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] === 'undefined' ? match : args[number];
  });
}



/*

 UserDefinedFunctions:
 -query for fn:
 connection
 .queryUserDefinedFunctions('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE r.id=something')
 .toArray(console.log)

 - create user defined function:
 var inPre = {
 id: 'isIn',
 body: function(val, array) { return array.some(function(e) { return e == val  }) }
 }

 connection.createUserDefinedFunction('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', inPre, console.log)

 - use them:
 connection
 .queryDocuments('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE isIn(3, r.arr)')
 .toArray(console.log)

 Operators:
 connection
 .queryDocuments('dbs/b5NCAA==/colls/b5NCAIu9NwA=/', 'SELECT * FROM root r WHERE r.age > 2', { enableScanInQuery: true })
 .toArray(console.log)


 Logical Conjunctive Operators:
 examples:
 ... WHERE (r.age=12 AND r.name="bar") OR (r.id=5)
  {
   $or: [
     { $and: [ { age: 12, name: "bar" } ] },
     { id: 5 }
   ]
  }

// Examples
    { $or: [ { a:1 }, { a:2, b:3 } ] }  => WHERE (r.a=1 OR r.a=2 AND r.b=3)
    { $and: [ { a:1 }, { a:2, b:3 } ] } => WHERE (r.a=1 AND r.a=2 AND r.b=3)
    { $and: [] }
 */

// Stored procedures or executions


function query(object, op) {
  var ops = { $or: 'OR', $and: 'AND' }
    , fKey = Object.keys(object)[0]
    , logic = ops[fKey]
    , str = (logic || op ? '' : '(')
    , op1 = [' ', op || 'AND', ' '].join('');

  function sign(object, operator) {
    var keys = Object.keys(object)
      , str = '';

    keys.forEach(function(key, i) {
      str += i ? ' ' : '';
      str += (typeof object[key] === 'object')
       ? query(object[key], ops[key])
       : 'r.' + key + '=' + object[key];
      str += (keys.length == i + 1) ? '' : ([' ', operator || 'AND'].join(''));
    });

    return keys.length > 1 ? '( ' + str + ' )' : str;
  }

  if(logic) {
    return str += (query(object[fKey], logic))
  }

  if(Array.isArray(object)) {
    var maps = object.map(function(el) {
      return sign(el, op);
    });
    str += maps.join(' ' + op1 + ' ');
  } else {
    str += sign(object, op1);
  }

  return str += (logic || op ? '' : ')');
}

