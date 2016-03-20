'use strict';

var env = process.env.NODE_ENV || 'development';
var config = require('./config/config.json')[env];
var express    = require('express');

var app        = express();
var sqlite3    = require('sqlite3').verbose();

var db = require('./models');

app.set('json spaces', 2);

var port = process.env.PORT || 8080;

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
        attributes: defaultAttributes,
        limit: 500
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

/*


router.route('/find/:str/:page?')
    .get(function(req, res) {
        var page = parseInt(req.params.page) || 1;
        var str = '%' + req.params.str + '%';
        var perpage = 200;
        db.get("SELECT COUNT(1) as total FROM sms WHERE mensagem LIKE ? OR numero LIKE ?", str, str, function(err, row) {
            if (err)
                res.send(err);

            var total = parseInt(row.total);
            var totalpages = Math.ceil(total / perpage);

            if (totalpages > 1 && page > totalpages) page = totalpages;

            var start = 0;
            if (page > 1) {
                start = (page - 1) * perpage;
            }

            db.all("SELECT id, datetime(data, 'unixepoch') as data, mensagem, origem FROM sms WHERE mensagem LIKE ? OR numero LIKE ? ORDER BY data DESC LIMIT ?,?", str, str, start, perpage, function(err, results) {
                if (err)
                    res.send(err);

                var next = null;
                if (page < totalpages) {
                    var nextpage = page + 1;
                    next = '/api/find/' +  req.params.str + '/' + nextpage;
                }

                var out = [{
                    'totalrecords': total,
                    'totalpages': totalpages,
                    'page': page,
                    'pagerecords': results.length,
                    'next' : next,
                    'records' : results
                }]

                res.json(out);
            });
        });
    });

*/
app.use('/', router);

app.listen(port);
console.log('LOLSTINING on port ' + port);