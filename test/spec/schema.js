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
        (function() {
          Schema.isValidSchema({ name: {} });
        }).should.throw();
      });
    });

    describe('missing required fields in schema', function() {
      it('should throw', function() {
        (function() {
          Schema.isValidSchema({ name: { type: String  } });
        }).should.not.throw();

        (function() {
          Schema.isValidSchema({
            name: { regex: /^/, expose: false, 'default': 21, type: String }
          });
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

    describe('schema API', function() {
      var schema = Schema.factory({
        name: { type: String, regex: /^[a-zA-Z]{3,}$/, expose: true, 'default': 'foo' },
        phone: { type: Number, expose: false, 'default': 123 }
      });
      describe('.omit()', function() {
        it('should get undefined/null/nutFound value and return it as-is', function() {
          should(schema.omit(undefined)).eql(undefined);
          should(schema.omit(null)).eql(null);
        });

        it('should omit unexposed fields', function() {
          schema.omit({ name: 'Ariel', phone: 32 }).should.eql({ name: 'Ariel' });
        });
      });

      describe('test.update()', function() {
        it('should return a promise', function(done) {
          var then = schema.test.update({});
          then.should.be.type('object');
          then.should.have.property('then').which.is.a.Function;
          done();
        });

        it('should return the model as-is if valid', function(done) {
          var o1 = { name: 'Ariel' };
          schema.test.update(o1)
            .then(function(o2) {
              o2.should.eql(o1);
              done();
            });
        });

        it('should ignore model fields that isn\'t existing in the schema', function(done) {
          var o1 = { createdAt: 'foo-bar',name:'Ariel' };
          schema.test.update(o1)
            .then(function(o2) {
              o2.should.eql(o1);
              done();
            });
        });

        it('should catch and return the errs', function(done) {
          var o1 = { name: 'o1', phone: undefined };
          schema.test.update(o1)
            .catch(function(err) {
              err.constructor.should.eql(Error);
              done();
            });
        });
      });

      describe('test.create()', function() {
        it('should return a promise', function(done) {
          var then = schema.test.create({});
          then.should.be.type('object');
          then.should.have.property('then').which.is.a.Function;
          done();
        });

        it('should return the fixture values', function(done) {
          schema.test.create({})
            .then(function(data) {
              data.should.eql({ name: 'foo', phone: 123 });
              done();
            });
        });

        it('should catch and return the errs', function(done) {
          var o1 = { name: 123 };
          schema.test.create(o1)
            .catch(function(err) {
              err.constructor.should.eql(Error);
              done();
            });
        });
      });
    });
  });
});