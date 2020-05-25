const express = require('express');
const router = express.Router({ mergeParams: true });
const passport = require('passport');
const authMiddleware = require('../middleware/auth');
require('dotenv').config();
const pool = require('../lib/database');

// INDEX TAG ROUTE
// manage/index view displays all tags, update/delete forms, add tag form
router.get('/', authMiddleware.isAuthorised, (req, res) => {
    // first - display all tags
    pool.query("SELECT * FROM tag", (err, result) => {
		if (err) {
            req.flash('error', err.message);
            res.redirect('back');
			console.log("DB error here " + err.message);
			throw err;
		}
		if(result.length > 0) res.render("./manage/index", { tags: result});
        else res.render("./manage/index", { tags: "Sorry, no tags" });
        
        //for index page always send array of tag statistics
	});
});

// ADD TAG ROUTE
router.post('/add-tag', authMiddleware.isAuthorised, async (req, res, done) => {
    //add tag to DB

    // req.body.blog.body = req.sanitize(req.body.blog.body);
    var tag = req.body.tag;
    
    var sql = "INSERT INTO blog (name, image, body) VALUES ('Test Blog', 'https://source.unsplash.com/random/400x300', 'Here in lies the body of the blog. Bloggidy bloggedie blog.')";
	await pool.query('INSERT INTO tag SET ?', tag, function(err, result) {
		if (err)  {
         req.flash('error', err.message);
         return done(null, false, res.redirect('back'));
        } 
		console.log("Tag added to DB");  
		// 2) redirect
        return done(null, result, res.redirect("/manage"));
    });
}); 

// UPDATE TAG ROUTE

// REMOVE TAG ROUTE
module.exports = router; 