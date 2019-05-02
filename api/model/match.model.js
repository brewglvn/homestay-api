'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchModel = new Schema({
  id: { type: mongoose.Schema.Types.ObjectId, required: true, auto: true, index: { unique: true } },
  data: {type: Object, required : true},
  date: {type: String, required: true},
  active: {type: Boolean, required: true },
  time: {type: Number, required: true}
});

module.exports = mongoose.model('Match', matchModel);
