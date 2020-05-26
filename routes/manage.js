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
        else res.render("./manage/index", { tags: "No tags created" });
        
        //for index page always send array of tag statistics
	});
});

// ADD TAG ROUTE
router.post('/add-tag', authMiddleware.isAuthorised, async (req, res, done) => {
    var tag = req.body.tag; //name, color
    
	await pool.query('INSERT INTO tag SET ?', tag, function(err, result) {
		if (err)  {
				//  req.flash('error', err.message);
				console.log(err.message);
				return done(null, false, res.redirect('back'));
        } 
		// 2) redirect
        return done(null, result, res.redirect("/manage"));
    });
}); 

// UPDATE TAG ROUTE
router.put('/update-tag', authMiddleware.isAuthorised, async (req, res, done) => {
    let tagID = req.body.tag.tag_id;
    let tagName = req.body.tag.name;
    let tagColor = req.body.tag.color;

    let sql = "UPDATE tag SET name = ?, color = ? WHERE tag_id = ?";

    await pool.query(sql, [tagName, tagColor, tagID], (err, result) => {
			if(err) {
				// req.flash('error', err.message);
				console.log(err.message);
				return done(null, false, res.redirect('back'));
			 } 
			 
			 return done(null, result, res.redirect('/manage'));
    });
});

// REMOVE TAG ROUTE
module.exports = router; 