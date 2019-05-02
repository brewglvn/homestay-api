'use strict';

const Joi = require('joi');
const jwt = require('jsonwebtoken');
const Boom = require('boom');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const User = require('../model/user.model');

Joi.objectId = require('joi-objectid')(Joi);

function createToken(user) {
    let scopes;
    if (user.admin) {
        scopes = 'admin';
    } else {
        scopes = 'user';
    }
    return jwt.sign(
        {id: user._id, email: user.email, scope: scopes },
        config.authkey,
        {algorithm: 'HS256', expiresIn: '1h' }
    );
}

function verifyUniqueUser(req, res) {
    User.findOne({
        $or: [{ email: req.payload.email }]
    },(err, user) => {
        if (user) {
            if (user.email === req.payload.email) {
                res(Boom.badRequest('Email taken'));
                return;
            }
        }
        res(req.payload);
    });
}
  
function verifyCredentials(req, res) {
    const password = req.payload.password;
    User.findOne({
        $or: [{ email: req.payload.email }]
    }, (err, user) => {
        if (!user) {
            return res(Boom.badRequest('Incorrect email!'));
        }
        bcrypt.compare(password, user.password, (err, isValid) => {
            if (isValid) {
                return res(user);
            }
            return res(Boom.badRequest('Incorrect password!'));
        });
    });
}

function verifyAdminCredentials(req, res) {
    const password = req.payload.password;
    User.findOne({
        $or: [{ email: req.payload.email }]
    }, (err, user) => {
        if (!user) {
            return res(Boom.badRequest('Incorrect email!'));
        }
        if(!user.admin){
            return res(Boom.badRequest('Only for admin account!'));
        }
        bcrypt.compare(password, user.password, (err, isValid) => {
            if (isValid) {
                return res(user);
            }
            return res(Boom.badRequest('Incorrect email!'));
        });
    });
}

const authenticateUserSchema = Joi.alternatives().try(
    Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    }),
    Joi.object({
        password: Joi.string().required()
    })
);

const checkUserSchema = Joi.object({
  email: Joi.string()
});

const createUserSchema = Joi.object({
    email: Joi.string().min(2).max(30).required(),
    password: Joi.string().required(),
    adminkey: Joi.string().required()
});

const paramsSchema = Joi.object({
  id: Joi.objectId().required()
});

const payloadSchema = Joi.object({
    email: Joi.string(),
    admin: Joi.boolean()
});

function hashPassword(password, cb) {
    // Generate a salt at level 10 strength
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, (err, hash) => {
            return cb(err, hash);
        });
    });
}

module.exports = {
    createToken : createToken,
    verifyUniqueUser: verifyUniqueUser,
    verifyCredentials: verifyCredentials,
    verifyAdminCredentials: verifyAdminCredentials,
    authenticateUserSchema : authenticateUserSchema,
    checkUserSchema : checkUserSchema,
    createUserSchema : createUserSchema,
    payloadSchema: payloadSchema,
    paramsSchema: paramsSchema,
    hashPassword: hashPassword
};
