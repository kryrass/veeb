const express = require('express');
const fs = require("fs");
const app = express();
const mysql = require('mysql2');
const timeInfo = require('./dateTimeFnc');
const bodyparser = require('body-parser');
const dbInfo = require('../../vp23config.js');
const multer = require('multer'); //fotode laadimiseks
const upload = multer({dest: './public/gallery/orig'}); //vahevara, mis määrab üleslaadimise kataloogi
const sharp = require('sharp');

app.set('view engine', 'ejs');
app.use(express.static('public'));
//kui tekst false kui pilt true
app.use(bodyparser.urlencoded({extended: true}));

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
/*
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
*/
app.get('/news', (req, res)=> {
	res.render('news');
});

app.get('/news/add', (req, res)=> {
	res.render('addnews');
});

app.post('/news/add', (req, res)=>{
	let notice = '';
	let sql = 'INSERT INTO vp_news (title, content, expire, userid) VALUES(?,?,?, 1)';
	conn.query(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
		if (err) {
			notice = 'Uudise salvestamine ebaõnnestus!';
			res.render('addnews', {notice: notice});
			throw err;
		}
		else {
			notice = ' salvestamine õnnestus!';
			res.render('addnews', {notice: notice}); 

		}
	});
});

app.get('/news/read', (req, res)=> {
	const dateSql = timeInfo.dateSqlEN();
	let sql = 'SELECT * FROM vpnews WHERE expire > '+dateSql+' AND deleted IS NULL ORDER BY id DESC';
	let sqlResult  = [];
	conn.query(sql, (err, result)=> {
		if (err) {
			res.render('readnews', {readnews:sqlResult});
			throw err;
		}
		else {
			res.render('readnews', {readnews:result}); 

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
/*
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
*/

app.get('/photoupload', (req, res)=> {
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
	conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
		if (err) {
			throw err;
			notice = 'Foto andmete salvestamine ebaõnnestus!';
			res.render('photoupload', {notice: notice});
		} else {
			notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
			res.render('photoupload', {notice: notice});

		}
	});

});

app.get('/photogallery', (req, res)=> {
	let photoList = [];
	let sql = 'SELECT id,filename,alttext FROM vp_gallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';
	conn.execute(sql, (err,result)=>{
		if (err){
			throw err;
			res.render('photogallery', {photoList : photoList});
		}
		else {
			photoList = result;
			console.log(result);
			res.render('photogallery', {photoList : photoList});
		}
	});
});


app.listen(5109);