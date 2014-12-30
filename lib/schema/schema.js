'use strict';
var _ = require('../utils');

/**
 * @description
 * initialize schema service
 * with `test`, `validator`, `omiter` etc..
 * @param schema
 */
function schemaFactory(schema) {
  /**
   * @description
   * @param model
   * @returns {*}
   */
  function omitUnexposed(model) {
    // If it's not found response
    if(!model) return model;
    _.forEach(schema, function(val, key) {
      return schema[key].expose
        ? true
        : delete model[key];
    });
    return model;
  }

  return {
    omit: omitUnexposed
  };
}

/**
 * @expose
 */
module.exports = schemaFactory;