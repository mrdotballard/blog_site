const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();
const pool = require('../lib/database');

router.get("/", function(req, res) {
	res.redirect("/blogs"); // redirecting to /blogs consumes flash messages and so will not display
});
  
// AUTH ROUTE
router.get('/login', (req, res) => {
	console.log(req.flash());
	res.render("login");
});

router.post('/login', passport.authenticate('local', {
	successRedirect: '/blogs',
	failureRedirect: '/login',
	failureFlash: true,
	successFlash: true
})
);  

router.get('/logout', function(req, res) {
	req.logout();
	req.flash("success", "You're logged out");
	res.redirect('/blogs');
});

  // REGISTER ROUTE
router.get('/register', (req, res) => {
	res.render('register');
});
router.get('/favicon.ico', (req, res) => {
	res.status(204); //prevent response to browser's GET for favicon (which should be in root folder)
});
router.post('/register', (req, res) => {
	newUser = req.body.user;   

	if(!newUser.username || newUser.username.trim() === '') 
			return res.render('register', { error: "Username cannot be blank" });
	if(!newUser.password || newUser.password.trim() === '')
			return res.render('register', { error: "Password cannot be blank" });

	// check user doesn't already exist in DB
	// adding of new user stays within this block as it's not async 
	// i.e. while waiting for pool.query it's already added duplicat user
	pool.query('SELECT * FROM user WHERE username = ? OR email = ?', [newUser.username, newUser.email], (err, result, fields) => {
		if(err) {
			console.log("sql error " + err);
			throw err;
		}
		if(result.length > 0) {
			return res.render('register', { error: 'Username or email already in use' });
		}

		// hash pw and add new user 
		newUser.password =  bcrypt.hashSync(newUser.password, 10);

		pool.query('INSERT INTO user SET ?', newUser, (err, result, fields) => {
			if(err) {
				console.log(err);
				throw err;
			}
			newUser.user_id = result.insertId;
			console.log("User added to DB");
			console.log(newUser);

			// once user succesfully added to DB, sign them in
			req.login(newUser, (err) => {
				if(err) {
				console.log(err);
				return res.render('register');
				}
				req.flash('success', 'Logged in successfully');
				return res.redirect('/blogs/bjr');
			});       
		});
	});
});

module.exports = router;