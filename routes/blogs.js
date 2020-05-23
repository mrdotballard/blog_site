const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
require('dotenv').config();
const pool = require('../lib/database'); //require dotenv config each time created


// INDEX ROUTE
router.get("/", (req, res) => {
	pool.query("SELECT * FROM blog", (err, result) => {
		if (err) {
			console.log("DB error here");
			throw err;
		}
		if(result.length > 0) res.render("./blogs/index", {blogs: result});
		else res.send("sorry no blogs");
	});
});


// NEW/CREATE ROUTE
router.get("/new", authMiddleware.isLoggedIn, function(req, res){
	res.render("./blogs/new");
});

router.post("/", authMiddleware.isLoggedIn, async (req, res, done) => {
	// 1) Create bog
	// req.body.blog.body = req.sanitize(req.body.blog.body);
	var post = req.body.blog;
	post.user_id = req.user.user_id;
	post.username = req.user.username;

		// var sql = "INSERT INTO blog (name, image, body) VALUES ('Test Blog', 'https://source.unsplash.com/random/400x300', 'Here in lies the body of the blog. Bloggidy bloggedie blog.')";
	await pool.query('INSERT INTO blog SET ?', post, function(err, result) {
		if (err) throw err;
		if(result.length > 0) console.log("Blow written to DB");
		// 2) redirect
		// console.log(result);
		return done(null, result, res.redirect("/blogs"));
	});
});

// SHOW ROUTE
router.get("/:blog_id", function(req, res){
// find sql entry in db
	pool.query('SELECT * FROM blog WHERE blog_id=?', [req.params.blog_id], function(err, result){
		if(err || !result[0]){
			console.log("DB error thrown: " + err);
			req.flash('error', 'No such blog');
			res.redirect("/blogs");
		} else{
			console.log(result[0]);
			res.render("./blogs/show", {blog: result[0]}); 
		}
	});
});

// EDIT ROUTE
router.get("/:blog_id/edit", authMiddleware.checkBlogOwnerShip, function(req, res) {
// pool.query('SELECT * FROM blog WHERE blog_id=?', [req.params.blog_id], function(err, result){
//   if(err){
//     console.log("error thrown: " + err);
//     res.redirect("/blogs"); 
//   } else{
		
//   res.render("./blogs/edit", {blog: result[0]}); 
//   }
// }); 
res.render("./blogs/edit", { blog: res.locals.foundBlog })
});


// UPDATE ROUTE
router.put("/:blog_id", authMiddleware.checkBlogOwnerShip, function(req, res) {
	req.body.blog.content = req.sanitize(req.body.blog.content);
	var blog = req.body.blog;
	var sql = "UPDATE blog SET ? WHERE blog_id = ?";

	pool.query(sql, [blog, req.params.blog_id], function(err, updatedBlog){
		// pool.query("UPDATE blog SET content = 'UPDATE' WHERE blog_id=5", function(err, result){
		if(err){
			console.log(err);
		} else {
			res.redirect("/blogs/" + req.params.blog_id);
		}
	});
}); 

// DELETE ROUTE 
router.delete("/:blog_id", function(req, res) {
	pool.query("DELETE FROM blog WHERE blog_id=?", [req.params.blog_id], function(err, result){
		if(err) {
			req.flash('error', 'Error - unable to delete blog');
			res.redirect("/blogs");
		} else {
			req.flash('success', 'Blog deleted');
			res.redirect("/blogs");
		}
	});
});


module.exports = router;