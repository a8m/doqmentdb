'use strict';
/*global describe, it, beforeEach, afterEach, stub*/
var should = require('should')
  , stub   = require('sinon').stub
  , sporcs = require('../../lib/sporc')
  , _      = require('../helpers');

// Stubs
var collectionManager = {
  queryDocuments: function(){},
  replaceDocument: function(){},
  createDocument: function(){},
  deleteDocument: function(){},
  getSelfLink: function(){}
};

var responseManager = {
  setBody: function(){}
};

global.getContext = function() {
  return {
    getCollection: function() {
      return collectionManager;
    },
    getResponse: function() {
      return responseManager;
    }
  };
};

describe('Stored procedures', function() {
  beforeEach(function() {
    stub(responseManager, 'setBody');
  });
  describe('$UPDATE', function() {
    var sporc = sporcs.$UPDATE
      , func = sporc.body;

    beforeEach(function() {
      stub(collectionManager, 'replaceDocument');
    });

    it('should has an `id` and `body`', function() {
      ('id' in sporc && 'body' in sporc).should.eql(true);
    });

    describe('onSuccess', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(null, [{ obj: {a: {}}, name: 'foo', arr: [], _self: '..' }]));
      });
      it('should call queryDocuments with the given query', function() {
        func('SELECT * FROM root r', { arr: { $push: 1 }, obj: {a: {b:2}} });
        collectionManager.queryDocuments.called.should.eql(true);
      });

      it('should call replaceDocument', function() {
        func('SELECT * FROM root r', { name: { $type: 'string' }, arr: { $concat: [2] }});
        collectionManager.replaceDocument.called.should.eql(true);
      });
      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });

    describe('onError', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(new Error, null));
      });
      it('should throw an error if occurs', function() {
        (function() {
          func('SELECT * FROM root r', { arr: { $push: 1 } });
        }).should.throw()
      });

      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });

    afterEach(function() {
      collectionManager.replaceDocument.restore();
    });
  });

  describe('$FIND_OR_CREATE', function() {
    var sporc = sporcs.$FIND_OR_CREATE
      , func = sporc.body;

    it('should has an `id` and `body`', function() {
      ('id' in sporc && 'body' in sporc).should.eql(true);
    });

    describe('when queryDocuments return empty array', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(null, []));
      });
      describe('onError#create', function() {
        beforeEach(function() {
          stub(collectionManager, 'createDocument',
            _.applyCallbackWith(new Error));
        });

        it('should throw', function() {
          (function() {
            func('SELECT * FROM root r', {});
          }).should.throw();
        });

        afterEach(function() {
          collectionManager.createDocument.restore();
        });
      });

      describe('onSuccess#create', function() {
        beforeEach(function() {
          stub(collectionManager, 'createDocument',
            _.applyCallbackWith(null, {}));
        });

        it('should not throw and set body', function() {
          func('SELECT * FROM root r', {});
          responseManager.setBody.calledWith({}).should.eql(true);
        });

        afterEach(function() {
          collectionManager.createDocument.restore();
        });
      });


      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });

    describe('when queryDocuments return array with objects', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(null, [_.MOCK.DOC]));
      });

      it('should called setBody() with the first arg', function() {
        func('..', {});
        responseManager.setBody.calledWith(_.MOCK.DOC).should.eql(true);
      });

      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });

    describe('when queryDocuments return an error', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(new Error, null));
      });

      it('should throw', function() {
        (function() {
          func('..', {});
        }).should.throw();
      });

      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });
  });

  describe('$REMOVE', function() {
    var sporc = sporcs.$REMOVE
      , func = sporc.body;

    it('should has an `id` and `body`', function() {
      ('id' in sporc && 'body' in sporc).should.eql(true);
    });

    describe('when queryDocuments return array with objects', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(null, [_.MOCK.DOC, _.MOCK.DOC]));
        stub(collectionManager, 'deleteDocument',
          _.applyCallbackWith(null, undefined));
      });

      it('should called deleteDocuments n time', function() {
        func('..', {});
        collectionManager.deleteDocument.callCount.should.eql(1);
      });

      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });

    describe('when queryDocuments return an error', function() {
      beforeEach(function() {
        stub(collectionManager, 'queryDocuments',
          _.applyCallbackWith(new Error, null));
      });

      it('should throw', function() {
        (function() {
          func('..', {});
        }).should.throw();
      });

      afterEach(function() {
        collectionManager.queryDocuments.restore();
      });
    });
  });


  afterEach(function() {
    responseManager.setBody.restore();
  });
});