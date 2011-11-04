// server.js
//
// w8for.me
//
// Copyright 2011, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var connect = require('connect');
var mongodb = require('mongodb');

var Db = mongodb.Db,
    Connection = mongodb.Connection,
    Server = mongodb.Server;

var returnJSON = function(res, code, payload) {
    res.writeHead(code, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(payload));
}

function notYetImplemented(req, res, next) {
    returnJSON(res, 500, "Not yet implemented");
}

var login = function(req, res, next) {
    var account = req.body;

    accounts.findOne({username: account.username}, function(err, acct) {
        if (err) {
            returnJSON(res, 500, err.message);
        } else if (acct === null) {
            returnJSON(res, 404, "No such user.");
        } else if (acct.password !== account.password) {
            returnJSON(res, 403, "Wrong password");
        } else {
            returnJSON(res, 200, acct.username);
        }
    });
};

var register = function(req, res, next) {

    var account = req.body;

    console.log("Registering new user: " + JSON.stringify(account));

    accounts.findOne({username: account.username}, function(err, acct) {
        if (err) {
            returnJSON(res, 500, err.message);
        } else if (acct !== null) {
            returnJSON(res, 409, "Conflict");
        } else {
            // FIXME: bcrypt the password
            accounts.save(account, function(err) {
                console.log(err);
                if (err) { 
                    returnJSON(res, 500, err.message);
                } else {
                    returnJSON(res, 200, account.username);
                }
            });
        }
    });
};

var server = connect.createServer(
    connect.logger(),
    connect.bodyParser(),
    connect.errorHandler({showMessage: true}),
    connect.query(),
    connect.static(__dirname + '/public'),
    connect.router(function(app) {
        // Activities
        app.post('/api/login', login);
        app.post('/api/register', register);
    })
);

var webport = process.env.PORT || 8001;
var webhost = process.env.HOSTNAME || 'localhost';

var dbhost = process.env.MONGO_NODE_DRIVER_HOST || 'localhost';
var dbport = process.env.MONGO_NODE_DRIVER_PORT || Connection.DEFAULT_PORT;

var client = new Db('w8forme', new Server(dbhost, dbport, {}));

var accounts = null;

client.open(function(err, db) {
    if (err) {
        console.log("Error: " + err);
    } else {
        db.collection('accounts', function(err, collection) {
            accounts = collection;
            server.listen(webport);
        });
    }
});
