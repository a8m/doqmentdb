'use strict';
var express    = require('express');
var bodyParser = require('body-parser');
var controller = require('./controller');
var app        = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.route('/')
  .get(controller.getAll)
  .post(controller.add);
app.route('/:id')
  .get(controller.get)
  .put(controller.update)
  .delete(controller.remove);

// Running
app.listen(3000);