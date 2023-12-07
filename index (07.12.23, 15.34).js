const express = require('express');
const fs = require("fs");
const app = express();
//Kui kõik db asjad pool'is ei ole seda enam vaja
const mysql = require('mysql2');
const timeInfo = require('./src/dateTimeFnc');
const bodyparser = require('body-parser');
//kui kõik poolis pole vaja
const dbInfo = require('../../vp23config.js');
const pool = require('./src/dataBasePool').pool;
const multer = require('multer'); //fotode laadimiseks
const upload = multer({dest: './public/gallery/orig'}); //vahevara, mis määrab üleslaadimise kataloogi
const sharp = require('sharp');
const async = require('async');
//paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
//kui tekst false kui pilt true
app.use(bodyparser.urlencoded({extended: true}));

//loon andmbebaasi ühenduse aga kui poolis. siis pole vaja
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.password,
	database: dbInfo.configData.database
});

app.get('/', (req, res)=>{
	//res.send('See töötab!');
	//res.download('index.js');
	res.render('index'); //, {notice: notice});
});

app.post('/', (req, res)=>{
	let notice = 'Sisesta oma kasutjakonto andmed!';
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log('Paha!');
		res.render('index', {notice: notice});
	}
	else {
		console.log('Hea!');
		let sql = 'SELECT password FROM vp_users WHERE email = ?';
		conn.execute(sql, [req.body.emailInput], (err, result)=>{
			if(err) {
				notice = 'Tehnilise vea tõttu ei saa sisse logida!';
				console.log(notice);
				res.render('index', {notice: notice});
			}
			else {
				//console.log(result);
				if(result[0] != null){
				console.log(result[0].password);
				bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
					if(err) {
						throw err;
					}
					else {
						if(compareresult){
							mySession = req.session;
							mySession.userName = req.body.emailInput;
							notice = mySession.userName + ' on sisse loginud!';
							console.log(notice);
							res.render('index', {notice: notice});

						}
						else {
							notice= 'Kasutajatunnus või parool oli vigane!';
							console.log(notice);
							res.render('index', {notice: notice});

						}
					}
				});
				}
				else {
					notice = 'Kasutajatunnus või parool oli vigane!';
					console.log(notice);
					res.remder('index', {notice: notice})
				}
			}
		});
		//res.render('index', {notice: notice});
	}
});

app.get('/logout', (req, res)=>{
	req.session.destroy();
	mySession = null;
	console.log('Logi välja');
	res.redirect('/');
});

app.get('/signup', (req, res)=>{
	
	res.render('signup');
});

app.post('/signup', (req, res)=>{
	let notice = 'Ootan andmeid!';
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log('Andmeid on puudu või pole nad korrektsed!');
		notice = 'Andmeid on puudu või pole nad korrektsed!';
		res.render('signup', {notice: notice});
	}
	else {
		console.log('Ok!');
		bcrypt.genSalt(10, (err, salt)=> {
			bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash)=>{
				let sql = 'INSERT INTO vp_users (firstname, lastname, birthdate, gender, email, password) VALUES(?,?,?,?,?,?)';
				conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result)=>{
					if(err){
						console.log(err);
						notice = 'Tehnilistel põhjustel kasutajat ei loodud!';
						res.render('signup', {notice: notice});
					}
					else {
						console.log('kasutaja loodud');
						notice = 'Kasutaja ' + req.body.emailInput + ' edukalt loodud!';
						res.render('signup', {notice: notice});
					}
				});
			});
		});
	}
	
	//res.render('signup');
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
		pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
			conn.query(sql, (err, result)=>{
				if (err){
					res.render('filmlist', {filmlist: sqlResult});
					throw err;
					//conn.end();
					connection.release();
				}
				else {
					//console.log(result);
					res.render('filmlist', {filmlist: result});
					//conn.end();
					connection.release();
				}
			});
		}
	});
	
});

app.get('/eestifilm/addfilmperson', (req, res)=>{
	res.render('addfilmperson');
});

app.get('/eestifilm/addfilmrelation', (req, res)=>{
	const myQueries = [
		function(callback){
			conn.execute('SELECT id,first_name,last_name FROM person', (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		}, 
		function(callback){
			conn.execute('SELECT id,title FROM movie', (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			}); 
		}
	];

	async.parallel(myQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			//siin kõik asjad, mis on vaja teha
			console.log(results);
		}
	});

	res.render('addfilmrelation');
});


app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
});

app.post('/news/add', (req, res)=>{
	let notice = '';
	let sql = 'INSERT INTO vp_news (title, content, expire, userid) VALUES(?,?,?, 1)';
		pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
			conn.query(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
				if (err) {
					notice = 'Uudise salvestamine ebaõnnestus!';
					res.render('addnews', {notice: notice});
					throw err;
					connection.release();
				}
				else {
					notice = ' salvestamine õnnestus!';
					res.render('addnews', {notice: notice}); 
					connection.release();

				}
			});
		}
	});
});

app.get('/news/read', (req, res)=> {
	const dateSql = timeInfo.dateSqlEN();
	let sql = 'SELECT * FROM vpnews WHERE expire > '+dateSql+' AND deleted IS NULL ORDER BY id DESC';
	let sqlResult  = [];
		pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
			conn.query(sql, (err, result)=> {
				if (err) {
					res.render('readnews', {readnews:sqlResult});
					throw err;
					connection.release();
				}
				else {
					res.render('readnews', {readnews:result}); 
					connection.release();
				}
			});
		}
	});
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
		pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
			conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
				if (err) {
					notice = 'Andmete salvestamine ebaõnnestus!';
					res.render('addfilmperson', {notice: notice});
					throw err;
					connection.release();
				}
				else {
					notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
					res.render('addfilmperson', {notice: notice}); 
					connection.release();

				}
			});
		}
	});
});

app.get('/eestifilm/singlemovie', (req, res)=>{
	res.render('singlemovie');
});

app.post('/eestifilm/singlemovie', (req, res)=>{
let notice = '';
	let sql = 'SELECT COUNT(id) FROM movie';
		pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
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
		}
	});
});


app.get('/photoupload', checkLogin, (req, res)=> {
	res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res)=>{
	let notice = '';
	console.log(req.file);
	console.log(req.body);
	const fileName = 'vp_' + Date.now() + '.jpg';
	//fs.rename(req.file.path, './public/gallery/orig' + req.file.originalname, (err)=>{
	fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err)=>{
		console.log('Faili laadimise viga' + err);
	});
	//loome kaks väiksema mõõduga pildivarianti
	sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
	sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
	//foto andmed andmetabelisse
	let sql = 'INSERT INTO vp_gallery (filename, originalname, alttext, privacy, userid) VALUES (?, ?, ?, ?, ?)';
	const userid = 1;

	pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
	// Andmebaasiosa
	conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
		if (err) {
			throw err;
			notice = 'Foto andmete salvestamine ebaõnnestus!';
			res.render('photoupload', {notice: notice});
			connection.release();
		} else {
			notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
			res.render('photoupload', {notice: notice});
			connection.release();

		}
	});
	// Andmebaasiosa lõpeb
		}
	});
});

app.get('/photogallery', (req, res)=> {
	let photoList = [];
	let sql = 'SELECT id,filename,alttext FROM vp_gallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';

	//andmebaasi ühendus pool'i kaudu
	pool.getConnection((err, connection)=>{ 
		if(err){ 
			throw err;
		}
		else { 
			//andmevaasi osa algab
			connection.execute(sql, (err,result)=>{
			if (err){
				throw err;
				res.render('photogallery', {photoList : photoList});
				connection.release();
			}
			else {
				photoList = result;
				console.log(result);
				res.render('photogallery', {photoList : photoList});
				connection.release();
		}
	});

	//andmebaasiosa lõpeb
		}//pool.ge4tConnection callback else lõpeb
	});
	
});

function checkLogin(req, res, next){
	console.log('kontrollime sisselogimist');
	if(req.session != null){
		if(mySession.userName){
			console.log('Täitsa sees on!');
			next();
		}
		else {
			console.log('Ei ole üldse sees');
			res.redirect('/');
		}
	}
	else {
		res.redirect('/');

	}
	
}

app.listen(5109);