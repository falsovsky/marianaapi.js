'use strict';

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.json')[env];

var express = require('express');
var db = require('./models');

var port = process.env.PORT || config.port || 8080;

var app = express();
var router = express.Router();


/* we need to pass a list of attributes to model.find functions because of two reasons:
   - the DATETIME() sqlite function
   - the schema is missing the standard columns createdAt and deletedAt */
var defaultAttributes =  [ 'id', ['DATETIME(data, "unixepoch")', 'data'], 'mensagem', 'numero', 'origem' ];

router.get('/', function(request, reply) {
    reply.json({ message: 'LOL JEWS' });
});

router.route('/id/:id').get(function(request, reply) {

    db.SMS.findOne({
        attributes: defaultAttributes,
        where: { 'id' : request.params.id }
    }).then(function(result) {

        reply.json(result);

    }).catch(function(error) {

        throw error;
        reply.send(error);

    });

});


router.route('/random').get(function(request, reply) {

    db.SMS.findOne({
        order: 'RANDOM()',
        attributes: defaultAttributes
    }).then(function(result) {

        reply.json(result);

    }).catch(function(error) {

        throw error;
        reply.send(error);

    });

});


router.route('/latest/:limit?').get(function(request, reply) {

    var limit = (request.params.limit || 15);
    if (limit > 500) {
        limit = 500;
    }

    db.SMS.findAll({
        attributes: defaultAttributes,
        limit: limit,
        order: [ ['data', 'DESC' ] ]
    }).then(function(result) {

        reply.json(result);

    }).catch(function(error) {

        throw error;
        reply.send(error);

    });

});


router.route('/find/:query/:page?').get(function(request, reply) {

    var page = parseInt(request.params.page) || 1;
    if (page < 1) {
        page = 1;
    }

    var query = request.params.query;

    /* a lower limit makes it easier to properly test pagination */
    var limit = 5;
    var offset = (page - 1) * limit;

    db.SMS.findAndCountAll({
        attributes: defaultAttributes,
        where: {
            $or: [{
                mensagem: { $like: '%' + query + '%' }
            }, {
                numero: { $like: query }
            }]
        },
        offset: offset,
        limit: limit,
        order: [ ['data', 'DESC' ] ]
    }).then(function(result) {

        var totalPages = Math.ceil(result.count / limit);

        var pagination = {
            totalRecords: result.count,
            totalPages: totalPages,
            currentPage: page,
            totalResults: result.count
        }

        if (page < totalPages) {
            pagination.nextPageUrl = '/api/find/' +  request.params.query + '/' + (page + 1);
            if (page > 1)  {
                pagination.prevPageUrl = '/api/find/' +  request.params.query + '/' + (page - 1);
            }
        }

        reply.json({
            pagination: pagination,
            results: result.rows
        });

    }).catch(function(error) {

        throw error;
        reply.send(error);

    });

});

app.set('json spaces', 2);

app.use('/', router);

app.listen(port);

console.log('LOLSTINING on port ' + port);