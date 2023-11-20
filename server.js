const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const app = express();

const assert = require('assert');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const mongourl = ''; 
const dbName = 'test';

app.set('view engine','ejs');

const SECRETKEY = 'COMPS381F';

const users = new Array(
	{name: 'user1', password: 'user1'},
	{name: 'user2', password: 'user2'}
);

app.use(session({
  name: 'loginSession',
  keys: [SECRETKEY]
}));

// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req,res) => {
	console.log(req.session);
	if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
		res.status(200).render('home',{name:req.session.username});
	}
});

app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});

app.post('/login', (req,res) => {
	users.forEach((user) => {
		if (user.name == req.body.name && user.password == req.body.password) {
			// correct user name + password
			// store the following name/value pairs in cookie session
			req.session.authenticated = true;        // 'authenticated': true
			req.session.username = req.body.name;	 // 'username': req.body.name		
		}
	});
	res.redirect('/');
});

app.get('/create', (req,res) => {
	res.status(200).render('create',{});
});

app.post('/create', (req,res) => {
//
});

app.get('/details', (req,res) => {
	res.status(200).render('details',{});
});

app.post('/details', (req,res) => {
//
});

app.get('/edit', (req,res) => {
	res.status(200).render('edit',{});
});

app.post('/edit', (req,res) => {
//
});

app.get('/search', (req,res) => {
	res.status(200).render('search',{});
});

app.post('/search', (req,res) => {
//
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);
