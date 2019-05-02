'use strict';

const bcrypt = require('bcryptjs');
const Boom = require('boom');
const User = require('../model/user.model');

const configs = require('../../config');

const authenticateUserSchema = require('../schemas/user.schemas').authenticateUserSchema;
const checkUserSchema = require('../schemas/user.schemas').checkUserSchema;
const createToken = require('../schemas/user.schemas').createToken;
const verifyUniqueUser = require('../schemas/user.schemas').verifyUniqueUser;
const verifyCredentials = require('../schemas/user.schemas').verifyCredentials;
const verifyAdminCredentials = require('../schemas/user.schemas').verifyAdminCredentials;
const hashPassword = require('../schemas/user.schemas').hashPassword;
const createUserSchema = require('../schemas/user.schemas').createUserSchema;
const payloadSchema = require('../schemas/user.schemas').payloadSchema;
const paramsSchema = require('../schemas/user.schemas').paramsSchema;

module.exports = [
	{
		method: 'POST',
		path: '/api/users/authenticate',
		config: {
			auth: false,
			// Check the user's password against the DB
			pre: [{ method: verifyCredentials, assign: 'user' }],
			handler: (req, res) => {
			  // If the user's password is correct, we can issue a token.
			  // If it was incorrect, the error will bubble up from the pre method
			  //res({ id_token:'Bearer '+ createToken(req.pre.user) }).code(201);
				res({ 'statusCode': 200, 'accessToken':'Bearer '+ createToken(req.pre.user) });
			},
			validate: {
				payload: authenticateUserSchema
			}
		}
	},
	{
		method: 'POST',
		path: '/api/users/check',
		config: {
			auth: false,
			pre: [{ method: verifyUniqueUser, assign: 'user' }],
			handler: (req, res) => {
				res(req.pre.user);
			},
			// Validate the payload against the Joi schema
			validate: {
				payload: checkUserSchema
			}
		}
	},
	{
		method: 'POST',
		path: '/api/users',
		config: {
			auth: false,
			// Before the route handler runs, verify that the user is unique
			pre: [{ method: verifyUniqueUser }],
			handler: (req, res) => {
				let user = new User();
				user.email = req.payload.email;
				if (req.payload.email === configs.adminusername) {
					user.admin = true;
				} else {
					user.admin = false;
				}
				if(configs.adminkey !== req.payload.adminkey){
					res(Boom.badRequest('Wrong admin key'));
					return;
				}
				hashPassword(req.payload.password, (err, hash) => {
					if (err) {
						res(Boom.badRequest(err));
						return;
					}
					user.password = hash;
					user.save((err, user) => {
						if (err) {
							res(Boom.badRequest(err));
							return;
						}
						// If the user is saved successfully, issue a JWT
						res({'statusCode': 200, 'user': user });
					});
				});
			},
			// Validate the payload against the Joi schema
			validate: {
				payload: createUserSchema
			}
		}
	},
	{
		method: 'POST',
		path: '/api/users/delbyid/{id}',
		config: {
			handler: (req, res) => {
				const id = req.params.id;
				User.findOneAndRemove({ id: id }, (err, user) => {
					if (err) {
						res(Boom.badRequest(err));
						return;
					}
					if (!user) {
						res(Boom.notFound('User not found!'));
						return;
					}
					res({ statusCode: 200, message: 'User removed!' });
				});
			},
			validate: {
				params: paramsSchema
			},
			auth: {
				strategy: 'jwt',
				scope: ['admin']
			}
		}
	},
	{
		method: 'GET',
		path: '/api/users/all',
		config: {
			handler: (req, res) => {
				User.find()
				// Deselect the password and version fields
				.select('-_id -__v')
				.exec((err, users) => {
					if (err) {
						res(Boom.badRequest(err));
						return;
					}
					if (!users.length) {
						res(Boom.badRequest('No user found!'));
						return;
					}
					res({"statusCode": 200,"data": users});
				});
			},
			// Add authentication to this route
			// The user must have a scope of `admin`
			auth: {
				strategy: 'jwt',
				scope: ['admin']
			}
		}
	},
	{
		method: 'POST',
		path: '/api/users/all',
		config: {
			auth: false,
			// Check the user's password against the DB
			pre: [{ method: verifyAdminCredentials, assign: 'user' }],
			handler: (req, res) => {
				User.find()
				// Deselect the password and version fields
				.select('-_id -__v')
				.exec((err, users) => {
					if (err) {
						res(Boom.badRequest(err));
						return;
					}
					if (!users.length) {
						res(Boom.badRequest('No item!'));
						return;
					}
					res({'statusCode': 200, 'accessToken':'Bearer '+ createToken(req.pre.user), 'data': users});
				});
			},
			validate: {
				payload: authenticateUserSchema
			}
		}
	},
	{
		method: 'POST',
		path: '/api/users/{id}',
		config: {
			pre: [{ method: verifyUniqueUser, assign: 'user' }],
			handler: (req, res) => {
				const id = req.params.id;

				User.findOneAndUpdate({ id: id }, req.pre.user, (err, user) => {
					if (err) {
						res(Boom.badRequest(err));
						return;
					}
					if (!user) {
						res(Boom.notFound('User not found!'));
						return;
					}
					res({ statusCode: 200, message: 'User updated!' });
				});
			},
			validate: {
				payload: payloadSchema,
				params: paramsSchema
			},
			auth: {
				strategy: 'jwt',
				scope: ['admin']
			}
		}
	}
];