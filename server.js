import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'password',
    database : 'smartbrain'
  }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());
/*
const database = {
	users: [
	{
		id: '001',
		name: 'April',
		email: 'April@gmail.com',
		password: 'cookies',
		entries: 0,
		joined: new Date()
	},
	{
		id: '002',
		name: 'John',
		email: 'John@gmail.com',
		password: '123456',
		entries: 0,
		joined: new Date()
	}
	],
	login: [
		{
			id: '987',
			hash: '',
			email: 'April@gmail.com'
		}
	]

}

app.get('/',(request,response) => {
	response.send(database.users)
})
*/

// SIGNIN
app.post('/signin', (request,response) => {
/*	
	if (request.body.email === database.users[0].email && 
		request.body.password === database.users[0].password) {
		response.json(database.users[0]);
	} else {
		response.status(400).json('error logging in !')
	}
*/	
	const {email, password} = request.body;
	if (!password || !email) {
		return response.status(400).json('Input fields are empty.')
	}
	db.select('email','hash').from('login')
		.where('email', '=', email)
		.then(data => {
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid) {
				return db.select('*').from('users')
				.where('email', '=', email)
				.then(user => {
					response.json(user[0])
				})
				.catch(err => response.status(400).json('unable to get user'))
				} else {
					response.status(400).json('wrong credentials')
				}
		})
		.catch(err => response.status(400).json('wrong credentials'))
		
})

// REGISTER
app.post('/register',(request,response) => {
	const {name, email, password} = request.body;
	if (!name || !password || !email) {
		return response.status(400).json('Input fields are empty.')
	}
	const hash = bcrypt.hashSync(password);
	db.transaction(trx => {
		trx.insert({
			hash: hash,
			email: email
		})
		.into('login')
		.returning('email')
		.then(loginEmail => {
			return trx('users')
			.returning('*')
			.insert({
			email: loginEmail[0],
			name: name,
			joined: new Date()
		})
		.then(user => {
		response.json(user[0]);
		})
	})
	.then(trx.commit)
	.catch(trx.rollback)
})
	
	.catch(err => response.status(400).json('Ahh ! Something is wrong, unable to register.'))
})

// PROFILE/USER ID
app.get('/profile/:id', (request,response) => {
	const { id } = request.params;
	db.select('*').from('users').where({id})
	.then(user=> {
		if (user.length) {
			response.json(user[0])
		} else{
			response.status(400).json('Not found')
		}
	})
	.catch(err => response.status(400).json('error getting user.'))
})

// USER IMAGE ENTRIES
app.put('/image', (request,response) => {
	const { id } = request.body;
	db('users').where('id', '=', id)
	.increment('entries', 1)
	.returning('entries')
	.then(entries => {
		response.json(entries[0]);
	})
	.catch(err => response.status(400).json('unable to get entries.'))
})
/*
bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});
*/
/*
// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});
*/

app.listen(3000, () => {
	console.log('app is running on port 3000 !!')
})
