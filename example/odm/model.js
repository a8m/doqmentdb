'use strict';

/**
 * @expose
 */
module.exports = {
  /**
   * @field name
   * @default no default value
   */
  name: {
    type: String,
    'default': ''
  },

  /**
   * @field email
   * @default no default value
   * @regex email, min-length = 10
   */
  email: {
    type: String,
    'default': '',
    regex: /^[a-zA-Z0-9@:%_\+.~#?&//=|/d]{10,}$/,
    error: '`email` must be type string, valid email address, and least 10 chars',
    expose: true
  },

  /**
   * @field password
   * @default no default value
   * @regex password
   */
  password: {
    type: String,
    'default': '',
    regex: /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d)(?=.*[!#$%&? "]).*$/,
    error: '`password` must be type string, contain 8 chars and at least one number, ' +
      'one letter and one unique character such as !#$%&? "',
    expose: false
  },

  /**
   * @field isAdmin
   * @default false
   */
  isAdmin: {
    type: Boolean,
    'default': false
  }
};
