'use strict';
var stub    = require('sinon').stub;
var should  = require('should');
var Schema  = require('../../lib/schema');

describe('SchemaService', function() {
  describe('.isValidSchema()', function() {
    it('should be typeof `function`', function() {
      Schema.isValidSchema.should.be.type('function');
    });

    describe('getting invalid parameters', function() {
      it('should throw', function() {
        should(Schema.isValidSchema({})).throw();
      });
    });

    describe('missing required fields in schema', function() {
      it('should throw', function() {
        (function(){
          Schema.isValidSchema({ name: { type:   String  } });
        }).should.throw();
      });
    });

    describe('getting fields as excepted', function() {
      it('should not throw', function() {
        (function(){
          Schema.factory({
            name: { type: String, regex: /^/, expose: false }
          })
        }).should.not.throw();
      });
    });
  });

  describe('.factory()', function() {
    it('should be typeof `function`', function() {
      Schema.factory.should.be.type('function');
    });

    it('should return an object', function() {
      Schema.factory({}).should.be.type('object');
    });
  });
});