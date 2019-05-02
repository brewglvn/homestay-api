'use strict';

var request = require('request');
var cheerio = require('cheerio');
const Boom = require('boom');
const configs = require('../../config');
const Match = require('../model/match.model');
const authenticateUserSchema = require('../schemas/user.schemas').authenticateUserSchema;
const verifyCredentials = require('../schemas/user.schemas').verifyCredentials;

module.exports = [
    {
        method: 'POST',
        path: '/api/homestay',
        config: {
            auth: false,
            // pre: [{ method: verifyUniqueMatch }], // check something exist
            handler: (req, res) => {

                // if(configs.adminkey !== req.payload.adminkey){
                //     res(Boom.badRequest('Wrong admin key'));
                //     return;
                // }

                let startUrl = 'https://www.homestay.com/vietnam';
                
                let urls = [
                    {url:startUrl}
                ];
                
                // for(let i=2; i<number ; i++){
                //     let urlString = startUrl+'/page/'+i;
                //     let urlObject = {url:urlString};
                //     urls.push(urlObject);
                // }

                const promise = urls.map((item, index) => {
                    let urlEncode = item['url'];
                    let p = new Promise((resolve, reject) => {
                        request(urlEncode, (err, response, body) => {
                            //console.log('url param', urlEncode);
                            if(err){
                                console.log(err);
                                let result = {
                                    'status': 400 , // bad request
                                    'data': []
                                };
                                console.log('fail ', err);
                                reject(result);
                            }
                            else if(response.statusCode !== 200 ){
                                let result = {
                                    'status': response.statusCode,
                                    'data': []
                                };
                                console.log('fail ', response.statusCode);
                                reject(result);
                            }
                            else{
                                const $ = cheerio.load(body);
                                
                                let result = [];
                                // $('.football-matches__day').toArray().map(matchesDay => {
                                $('#homestays > li > a').toArray().map(element => {
                                    let url= 'https://www.homestay.com'+$(element).attr('href');
                                    let url_image = $(element).find('.picture').attr('data-layzr');
                                    let title = $(element).find('.col-sm-8.col-xs-12.content > h4').text();
                                    let profile = $(element).find('.col-sm-8.col-xs-12.content > div.profile_photo > img').attr('data-layzr');
                                    let homestay = $(element).find('.col-sm-8.col-xs-12.content > p.homestay').text();
                                    let length_of_homestay = $(element).find('.col-sm-8.col-xs-12.content > div.length-of-stay.small.text-gray').text();
                                    let description = $(element).find('.col-sm-8.col-xs-12.content > p.description.hidden-xs').text();
                                    let price = $(element).find('.col-sm-8.col-xs-12.content > p.price_from').text();
                                    
                                    let data = {
                                        title: title,
                                        profile: profile,
                                        homestay: homestay,
                                        length_of_homestay: length_of_homestay,
                                        description: description,
                                        price: price,
                                        url: url,
                                        image: url_image
                                    };
                                    result.push(data);
                                });
                                resolve(result);
                            }
                        });
                    });
                    return p;
                });

                Promise.all(promise)
                .then(repos =>{
                    let currentDate = new Date();
                    let day = currentDate.getDate();
                    let month = currentDate.getMonth() + 1;
                    let year = currentDate.getFullYear();
                    let hour = currentDate.getUTCHours();
                    let fullday = hour + ':' + day + "/" + month + "/" + year;
                    let thesecs = currentDate.getTime();
                    let m = new Match({
                        date: fullday,
                        active: true,
                        time: thesecs,
                        data: repos[0]
                    });
                    m.save(err => {
                        if (err) {
                            res(Boom.badRequest(err));
                            return;
                        }
                        //res({status : '200'});
                    });
                    res(m);
                })
                .catch(err => {res({status : '404'})});
            },
            validate: {}
        }
    },
    {
        method: 'POST',
        path: '/api/homestays',
        config: {
            handler: (req, res) => {
                let matchOB = [];
                let statusCode = '200';
                Match.find({active : true})
                .sort({ $natural: -1 })
                .limit(1)
                .select('-__v -_id -id')
                .exec((err, matches) => {
                    if (!err && matches.length > 0) {
                        matchOB = matches[0].data;
                    }
                    else{
                        statusCode = '400';
                    }
                    res({
                        'statusCode': statusCode, 
                        'matches': matchOB
                    });
                });
            },
            auth: false
            // auth: {
            //     strategy: 'jwt',
            //     scope: ['admin', 'user']
            // }
        }
    }
];