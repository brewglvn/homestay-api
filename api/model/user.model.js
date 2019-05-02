'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userModel = new Schema({
  id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true, index: { unique: true } },
  email: { type: String, required: true },
  password: { type: String, required: true },
  admin: { type: Boolean, required: true }
});

module.exports = mongoose.model('User', userModel);
