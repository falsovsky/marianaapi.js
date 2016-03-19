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



process.exit(0);

router.get('/', function(req, res) {
    res.json({ message: 'LOL JEWS' });
});

router.route('/id/:id')
    .get(function(req, res) {
        db.get("SELECT id, datetime(data, 'unixepoch') as data, mensagem, origem FROM sms WHERE id = ?", req.params.id, function(err, row) {
            if (err)
                res.send(err);

            res.json(row);
        });
    });

router.route('/random')
    .get(function(req, res) {
        db.get("SELECT id, datetime(data, 'unixepoch') as data, mensagem, origem FROM sms ORDER BY RANDOM() LIMIT 1", function(err, row) {
            if (err)
                res.send(err);

            res.json(row);
        });
    });

router.route('/latest/:num?')
    .get(function(req, res) {
        var num = req.params.num || 15;
        if (num > 500) num = 500;
        db.all("SELECT id, datetime(data, 'unixepoch') as data, mensagem, origem FROM sms ORDER BY data DESC LIMIT ?", num, function(err, results) {
            if (err)
                res.send(err);

            res.json(results);
        });
    });

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

app.use('/', router);

app.listen(port);
console.log('LOLSTINING on port ' + port);