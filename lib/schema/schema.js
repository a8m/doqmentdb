'use strict';
var _       = require('../utils')
  , Promise = require('bluebird');

/**
 * @description
 * initialize schema service
 * with `test`, `validator`, `omiter` etc..
 * @param schema
 */
function schemaFactory(schema) {

  /**
   * @description
   * omit unexposed fields
   * @param model
   * @returns {*}
   */
  function omitUnexposed(model) {
    // If it's not found response
    if(!model) return model;
    _.forEach(schema, function(val, key) {
      var expose = schema[key].expose;
      return _.isUndefined(expose) || expose
        ? true
        : delete model[key];
    });
    return model;
  }

  /**
   * @description
   * alidate fields, based on regex and type
   * @param model
   * @returns {boolean}
   */
  function testFields(model) {
    var fails = 0;
    var errs = [];
    _.forEach(model, function(val, key) {
      if(_.isUndefined(val) || _.isUndefined(schema[key])) return;
      var regex = schema[key].regex;
      var ctr = schema[key].type;
      // type(constructor) validation || regex
      if(ctr !== val.constructor || (regex ? !regex.test(val) : false)) {
        ++fails;
        errs.push(schema[key].error || 'Invalid value in: `' + key + '`');
      }
    });
    return !fails ? model : errs;
  }

  /**
   * @description
   * complete unavailable fields,
   * and omit those are not in the schema
   * @param model
   * @returns {{}}
   */
  function fixFields(model) {
    var m = {};
    _.forEach(schema, function(val, key) {
      m[key] = _.isDefined(model[key])
        ? model[key]
        : val.default;
    });
    return m;
  }

  /**
   * @description
   * test for update operation based promise
   * @param model
   * @returns {Promise}
   */
  function update(model) {
    return new Promise(function(resolve, reject) {
      var res = testFields(model);
      return res === model
        ? resolve(model)
        : reject(Error(res));
    });
  }

  /**
   * @description
   * test for create operation based promise
   * @param model
   * @returns {Promise}
   */
  function create(model) {
    return update(fixFields(model));
  }

  /**
   * @expose
   */
  return {
    omit: omitUnexposed,
    test: { update: update, create: create }
  };
}

/**
 * @expose
 */
module.exports = schemaFactory;