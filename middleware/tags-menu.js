const passport = require('passport');
require('dotenv').config();
const pool = require('../lib/database');

module.exports = (req, res, next) => {
   pool.query("SELECT t.*, COUNT(bt.tag_id) AS blog_count FROM tag AS t LEFT JOIN blog_tag AS bt ON t.tag_id = bt.tag_id GROUP BY t.tag_id", (err, result) => {
		if (err) {
			req.flash('error', err.message);
			res.redirect('back');
			console.log("DB error here " + err.message);
			throw err;
		}
		console.log("TAGS MENU result: " + JSON.stringify(result));
		if(result.length > 0) res.locals.tagsMenu = result;
        else res.locals.tagsMenu = "No tags created";
        
        next();
        //for index page always send array of tag statistics
	});
} 