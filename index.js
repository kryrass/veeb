const express = require('express');
const fs = require("fs");
const app = express();
const mysql = require('mysql2');
const timeInfo = require('./dateTimeFnc');
const bodyparser = require('body-parser');
const dbInfo = require('../../vp23config.js');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmbebaasi ühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dbInfo.configData.database
});

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index');
});

app.get('/timenow', (req, res)=>{
	const dateNow = timeInfo.dateNowET();
	const timeNow = timeInfo.timeNowET();
	res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

app.get('/wisdom', (req, res)=>{
let folkWisdon = [];
fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
	if(err){
		throw err;
	}
		else {
			folkWisdom = data.split(';');
			res.render('justlist', {h1: 'Vanasõnad', wisdom: folkWisdom});
		}
	});

});

app.get('/namelist', (req, res)=>{
let namelist = [];
fs.readFile('public/txtfiles/log.txt', 'utf8', (err, data)=>{
	if(err){
		throw err;
	}
		else {
			namelist = data.replaceAll(",", " ").split(';');
			res.render('namelist', {h1: 'nimed', name: namelist});
		}
	});

});

app.get('/eestifilm', (req, res)=>{
	res.render('filmindex');
});

app.get('/eestifilm/filmiloend', (req, res)=>{
	let sql = 'SELECT title, production_year, duration FROM movie';
	let sqlResult = [];
	conn.query(sql, (err, result)=>{
		if (err){
			res.render('filmlist', {filmlist: sqlResult});
			throw err;
			//conn.end();
		}
		else {
			//console.log(result);
			res.render('filmlist', {filmlist: result});
			//conn.end();
		}
	});
	
});

app.get('/eestifilm/addfilmperson', (req, res)=>{
	res.render('addfilmperson');
});

app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
});

app.get('/news/read', (req, res)=> {
	res.render('readnews');
});

app.get('/news/read/:id', (req, res)=> {
	//res.render('readnews');
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

app.get('/news/read/:id/:lang', (req, res)=> {
	//res.render('readnews');
	console.log(req.params);
	console.log(req.query);
	res.send('Tahame uudist, mille id on: ' + req.params.id);
});

app.post('/eestifilm/addfilmperson', (req, res)=>{
	//res.render('filmindex');
	//res.send("req.body");
	let notice = '';
	let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?,?,?)';
	conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
		if (err) {
			notice = 'Andmete salvestamine ebaõnnestus!';
			res.render('addfilmperson', {notice: notice});
			throw err;
		}
		else {
			notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
			res.render('addfilmperson', {notice: notice}); 

		}
	});
});

app.get('/eestifilm/singlemovie', (req, res)=>{
	res.render('singlemovie');
});

app.post('/eestifilm/singlemovie', (req, res)=>{
let notice = '';
	let sql = 'SELECT COUNT(id) FROM movie';
	conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
		if (err) {
			notice = 'Andmete salvestamine ebaõnnestus!';
			res.render('singlemovie', {notice: notice});
			throw err;
		}
		else {
			//notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
			res.render('singlemovie', {notice: notice}); 

		}
	});
});


app.listen(5109);