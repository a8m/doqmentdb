'use strict';
/**
 * @expose
 */
module.exports = {
  FIELDS: {
    REQUIRED: [
      { name: 'type',   type: Function }
    ],
    OPTIONAL: [
      { name: 'default', type: 'type'  }, // type as `type` field
      { name: 'error',   type: String  },
      { name: 'regex',   type: RegExp  },
      { name: 'expose',  type: Boolean }
    ]
  },
  HOOKS: {
    NAMES: {
      CREATE: 'create',
      DELETE: 'delete',
      UPDATE: 'update',
      UPSERT: 'upsert'
    },
    ALIASES: {
      save:   'create',
      insert: 'create',
      remove: 'delete'
    }
  }
};
