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
      { name: 'fixture', type: 'type' }, // type as `type` field
      { name: 'error',   type: String }
    ]
  },
  HOOKS: {
    NAMES: {
      CREATE: 'create',
      DELETE: 'delete',
      UPDATE: 'update'
    },
    ALIASES: {
      save:   'create',
      insert: 'create',
      remove: 'delete'
    }
  }
};