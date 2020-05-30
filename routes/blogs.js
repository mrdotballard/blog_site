const express = require('express');
const router = express.Router({ mergeParams: true });
const authMiddleware = require('../middleware/auth');
require('dotenv').config();
const pool = require('../lib/database'); //require dotenv config each time created


// INDEX ROUTE
router.get("/", (req, res) => {
	/** must be LEFT JOIN else returns nothing, since there is no
		blog_id in blog_tag table. LEFT JOIN still returns matches in 'left' table, i.e. blog table **/
	pool.query("SELECT b.*, JSON_ARRAYAGG(JSON_OBJECT('id', t.tag_id, 'name', t.name, 'color', t.color)) AS tags FROM blog b LEFT JOIN blog_tag bt ON bt.blog_id = b.blog_id LEFT JOIN tag t ON bt.tag_id = t.tag_id GROUP BY b.blog_id", (err, allBlogs) => {
		if (err) {
			console.log("DB error here");
			throw err; 
		}
		if(allBlogs.length > 0) {
			pool.query("SELECT * from tag", (err, allTags) => {
				if(err) throw err;
			//	console.log("allTags: " + allTags);
			// console.log(JSON.parse(allBlogs[0].tags)[0].color);
			// multipul blogs returned so pass entire array - without [0] index
			res.render("./blogs/index", { blogs: allBlogs });
			});
		} 
		else res.render("./blogs/index", { blogs: "Sorry no blogs to display" });
	}); 
}); 


// NEW ROUTE
router.get("/new", authMiddleware.isLoggedIn, function(req, res, done){
	// get tag list to send to new view
	pool.query('SELECT * FROM tag', (err, result) => {
		if(err) throw err;
		if(result.length > 0) 
			res.render("./blogs/new", { tags: result });
		else
			res.render("./blogs/new", { tags: "No tags created" });
	});
});    

// CREATE ROUTE
router.post("/", authMiddleware.isLoggedIn, async (req, res, done) => {
	// req.body.blog.body = req.sanitize(req.body.blog.body);
	let post = req.body.blog;
	post.user_id = req.user.user_id;
	post.username = req.user.username;

	let tags = req.body.blogTags; //post and tags coming from 'new' view POST
	let tagParams = []; //storing tag_id only

	await pool.query('INSERT INTO blog SET ?', post, function(err, result) {
		if (err) throw err;
		// if post inserted successfully check for tags and add them to post
		let blogID = result.insertId; // get returned blog_id for relation table

		if(tags && typeof tags === 'string') { // only one tag selected - param given as string
			tagParams = [
				[blogID, tags]
			];
		} else if(tags) { // if tags is defined then more than one tag selected - param is array of strings
			tags.forEach(tag => {
				tagParams.push([blogID, tag]); //a nested array of blog_id and tag_id
			});
		}

		if(tags) {
		pool.query("INSERT INTO blog_tag (blog_id, tag_id) VALUES ?", [tagParams], (err, result) => {
			if(err) throw err;
			if(result) console.log(result);
		});
	}
		return done(null, result, res.redirect("/blogs"));
	});
});  
 
// SHOW ROUTE
router.get("/:blog_id", function(req, res){
	pool.query("SELECT b.*, JSON_ARRAYAGG(JSON_OBJECT('id', t.tag_id, 'name', t.name, 'color', t.color)) AS tags FROM blog b JOIN blog_tag bt ON bt.blog_id = b.blog_id JOIN tag t ON bt.tag_id = t.tag_id WHERE b.blog_id = ?", [req.params.blog_id],
	(err, result) => {
		if(err || !result[0]){
			console.log("DB error thrown: " + err);
			req.flash('error', 'No such blog');
			res.redirect("/blogs"); 
		} else{
			res.render("./blogs/show", { blog: result[0] }); 
		}
	});
});

// EDIT ROUTE
router.get("/:blog_id/edit", authMiddleware.checkBlogOwnerShip, function(req, res) {
	pool.query("SELECT b.*, JSON_ARRAYAGG(JSON_OBJECT('id', t.tag_id, 'name', t.name, 'color', t.color)) AS tags FROM blog b JOIN blog_tag bt ON bt.blog_id = b.blog_id JOIN tag t ON bt.tag_id = t.tag_id WHERE b.blog_id = ?", [req.params.blog_id],
	(err, result) => {
		if(err) throw err;

		pool.query("SELECT * FROM tag", (err, allTags) => {
			if(err) throw err;
			//console.log(result[0]);
			//console.log(allTags);

			if(allTags.length > 0) {
				res.render("./blogs/edit", { blog: result[0], allTags: allTags }); 		
			}
			else{ 
				console.log("no tags to pass to edit route");
				res.render("./blogs/edit", { blog: result[0], allTags: "No tags created" });
			}
		});
					// res.render("./blogs/edit", { blog: result[0] }); 		

	}); 
 
	// res.locals.foundBlog set in middleware checkBlogOwnerShip
	// res.render("./blogs/edit", { blog: res.locals.foundBlog })
});

// UPDATE ROUTE
router.put("/:blog_id", authMiddleware.checkBlogOwnerShip, function(req, res) {
	req.body.blog.content = req.sanitize(req.body.blog.content);
	let blogID = req.params.blog_id;
	let tags = req.body.blogTags;
	let tagParams = [];

	// update blog table
	pool.query("UPDATE blog SET ? WHERE blog_id = ?", [req.body.blog, blogID], function(err, updatedBlog){
		if(err) throw err;
	});

	// remove all tags
	pool.query("DELETE FROM blog_tag WHERE blog_id = ?", blogID, (err, result) => {
		if(err) throw err;
	});

	if(tags && typeof tags === 'string') { // only one tag selected - param given as string
		tagParams = [
			[blogID, tags]
		];
	} else if(tags) { // if tags is defined then more than one tag selected - param is array of strings
		tags.forEach(tag => {
			tagParams.push([blogID, tag]); //a nested array of blog_id and tag_id
		});
	}
	// update new tags if any
	if(tags) {
		pool.query("INSERT INTO blog_tag (blog_id, tag_id) VALUES ?", [tagParams], (err, result) => {
			if(err) throw err;
		})
	}
	res.redirect("/blogs/" + blogID);

}); 

// DELETE ROUTE 
router.delete("/:blog_id", authMiddleware.checkBlogOwnerShip, function(req, res) {
	pool.query("DELETE FROM blog WHERE blog_id = ?", [req.params.blog_id], function(err, result){
		if(err) throw err;

			req.flash('success', 'Blog deleted and removed from tag lists');
			res.redirect("/blogs");

	});
});


module.exports = router;

/**
*/