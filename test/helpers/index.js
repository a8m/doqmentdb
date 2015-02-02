'use strict';
/**
 * @description
 * fake DocumentDB toArray function
 */
function toArray(args) {
  return { toArray: function(fb) { fb.apply(null, args);} }
}

/**
 * @description
 * apply callback
 */
function applyCallback(o1, o2, cb) {
  return (cb||o2)()
}

function applyCallbackWith() {
  var args = arguments;
  return function(a, b, c) {
    (c || b).apply(null, args);
  }
}

/**
 * @description
 * helper function, `withArgs` is optional
 */
function assertCalled(q, done, toCalled, withArgs) {
  q.then(function(res) {
    (toCalled.called).should.eql(true);
    // Test `calledWith` with the given arguments.
    if(withArgs) {
      toCalled.calledWith.apply(toCalled, withArgs).should.eql(true);
    }
    done();
  });
}

/**
 * @expose
 */
module.exports = {
  toArray: toArray,
  assertCalled: assertCalled,
  applyCallback: applyCallback,
  applyCallbackWith: applyCallbackWith,
  MOCK: {
    DB:   { _self: '/self/db',  _colls: '/colls' },
    COLL: { _self: '/self/col', _docs:  '/docs'  },
    DOC:  { _self: '/self/doc', _id:    '54123'  }
  }
};