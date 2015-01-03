'use strict';
var users = require('./model/users');

/**
 * @private
 * @description
 * responseFactory, should get Express response function.
 * @param res
 * @returns {Function}
 */
function resFactory(res) {
  return function(ret) {
    if(ret === null || typeof ret === 'undefined') {
      return res.status(404).send('Not Found');
    }
    return ret.constructor === Error
      ? res.status(421).send(ret.message)
      : res.status(200).send(ret);
  }
}

/**
 * @description
 * get all users
 * @route /
 * @method GET
 */
function getAction(req, res) {
  var id = req.params.id || '';
  var response = resFactory(res);
  users.findById(id)
    .then(response)
    .catch(response);
}

/**
 * @description
 * create new user
 * @route /
 * @method POST
 */
function addAction(req, res) {
  var response = resFactory(res);
  users.create(req.body)
    .then(response)
    .catch(response);
}

/**
 * @description
 * update specific user
 * @route /:id
 * @method PUT
 */
function updateAction(req, res) {
  var id = req.params.id || '';
  var response = resFactory(res);
  users.update({ id: id }, req.body)
    .then(response)
    .catch(response);
}

/**
 * @description
 * get all users
 * @route /
 * @method GET
 */
function getAllAction(req, res) {
  var response = resFactory(res);
  users.find({})
    .then(response)
    .catch(response);
}

/**
 * @description
 * remove user by id
 * @route /:id
 * @method DELETE
 */
function removeAction(req, res) {
  var id = req.params.id || '';
  var response = resFactory(res);
  users.findAndRemove({ id: id })
    .then(response)
    .catch(response);
}

module.exports = {
  get: getAction,
  add: addAction,
  update: updateAction,
  remove: removeAction,
  getAll: getAllAction
};