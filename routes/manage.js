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
    // pool.query("SELECT * FROM tag", (err, result) => {
		// returns tags and counts number of times tag is listed in blog_tag index table
		// must be LEFT JOIN as some tags may have now count, i.e. no tagging any blog
    pool.query("SELECT t.*, COUNT(bt.tag_id) AS blog_count FROM tag AS t LEFT JOIN blog_tag AS bt ON t.tag_id = bt.tag_id GROUP BY t.tag_id", (err, result) => {
		if (err) {
			req.flash('error', err.message);
			res.redirect('back');
			console.log("DB error here " + err.message);
			throw err;
		}
		console.log("result: " + result);
		if(result.length > 0) res.render("./manage/index", { tags: result });
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
				req.flash('error', err.message);
				console.log("ERROR: " + err.message);
				return done(null, false, res.redirect('/manage'));
			 } 
			 
			 return done(null, result, res.redirect('/manage'));
    });
});

// REMOVE TAG ROUTE
router.delete("/", authMiddleware.isAuthorised, async (req, res, done) => {
	let tag = req.body.tag;
	console.log(tag);
	await pool.query("DELETE FROM tag WHERE tag_id = ?", 
		[tag.tag_id], (err, result) => {
			if(err) {
				req.flash('error', err.message);
				return done(null, false, res.redirect('back'));
			} 
			req.flash('success', 'Tag deleted and removed from associated posts');
			return done(null, result, res.redirect('/manage'));
	});

});
module.exports = router; 