'use strict';
/**
 * @expose
 */
module.exports = {
  FIELDS: {
    REQUIRED: [
      { name: 'type',   type: Function },
      { name: 'regex',  type: RegExp   },
      { name: 'expose', type: Boolean  }
    ],
    OPTIONAL: [
      { name: 'fixture', type: 'type' }, // type as `name` field
      { name: 'error',     type: String }
    ]
  }
};