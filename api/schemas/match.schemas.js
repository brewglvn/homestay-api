'use strict';

const Joi = require('joi');

const createMatchSchema = Joi.object({
    data: Joi.object().required(),
    date: Joi.string().required(),
    active: Joi.bool().required(),
    time: Joi.number().required()
});

function verifyUniqueMatch(req, res) {
    res(req.payload);
}

module.exports = {
    createMatchSchema: createMatchSchema,
    verifyUniqueMatch: verifyUniqueMatch
};
