var bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  expressSanitizer = require('express-sanitizer'),
  mysql = require('mysql'),
  express = require('express'),
  app = express();

// APP CONFIG
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(expressSanitizer());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// MYSQL/DATABASE CONFIG
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'matthew',
  password: 'triune3*UP',
  database: 'myblog'
});




connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected to database!");

  //*** CREATE DATABASE ***
  connection.query("CREATE DATABASE IF NOT EXISTS myblog", function (err, result) {
    if (err) {
      console.log("Database 'myblog' aleady exists");
      throw err;
    }
    else {
      console.log("Database 'myblog' created");      
    }
  });

    //*** CREATE TABLES***
    // - USER
  var sql_user = "CREATE TABLE IF NOT EXISTS user(" +
    "user_id INT PRIMARY KEY AUTO_INCREMENT," +
    "user_name VARCHAR(100)," +
    "password VARCHAR(250)," +
    
    // - BLOG
  var sql_blog = "CREATE TABLE IF NOT EXISTS blog(" +
    "blog_id INT PRIMARY KEY AUTO_INCREMENT, " +
    "user_id INT," +
    "title VARCHAR(100)," +
    "intro TEXT," +
    "content TEXT," +
    "created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)," +
    "FOREIGN KEY (user_id) REFERENCES user (user_id)";
  connection.query(sql, function (err, result) {
  if (err) throw err;
  console.log("Table blog created");
  });
});


/**
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  var sql = "ALTER TABLE customers ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Table altered");
  });
});
**/

/*** INSERTING RECORD
connection.connect(function(err) {
  if(err) throw err;
  console.log("connected to insert into table");
   
  var sql = "INSERT INTO blog (name, image, body) VALUES ('Test Blog', 'https://source.unsplash.com/random/400x300', 'Here in lies the body of the blog. Bloggidy bloggedie blog.')";
  connection.query(sql, function(err, result) {
    if (err) throw err;
    console.log(result);
  });
});
*/


// RESTFUL ROUTES CONFIG
app.get("/", function(req, res) {
  res.redirect("/blogs");
});

// INDEX ROUTE
app.get("/blogs", function(req, res) {
  // connection.connect(function(err) {
    // if (err) throw err;
    connection.query("SELECT * FROM blog", function (err, result) {
      if (err) throw err;

      res.render("index", {blogs: result});
  // connection.end();
    });
  // });
});


// NEW/CREATE ROUTE
app.get("/blogs/new", function(req, res){
  res.render("new");
});

app.post("/blogs", function(req, res) {
    // 1) Create bog
  // req.body.blog.body = req.sanitize(req.body.blog.body);
  
  var post = req.body.blog;
    // var sql = "INSERT INTO blog (name, image, body) VALUES ('Test Blog', 'https://source.unsplash.com/random/400x300', 'Here in lies the body of the blog. Bloggidy bloggedie blog.')";
  connection.query('INSERT INTO blog SET ?', post, function(err, result) {
    if (err) throw err;
    // 2) redirect
    res.redirect("/blogs");
  });
});

 
// SHOW ROUTE
app.get("/blogs/:id", function(req, res){
  
  // find sql entry in db
    connection.query('SELECT * FROM blog WHERE id=?', [req.params.id], function(err, result){
      if(err){
        console.log("error thrown: " + err);
        res.redirect("/blogs");
      } else{

        res.render("show", {blog: result[0]}); 
      }
    });

  // else redirect to index (/blogs)
});


// EDIT ROUTE
app.get("/blogs/:id/edit", function(req, res) {
  connection.query('SELECT * FROM blog WHERE id=?', [req.params.id], function(err, result){
    if(err){
      console.log("error thrown: " + err);
      res.redirect("/blogs");
    } else{
      
    res.render("edit", {blog: result[0]}); 
    }
  }); 
});


// UPDATE ROUTE
app.put("/blogs/:id", function(req, res) {
  req.body.blog.body = req.sanitize(req.body.blog.body);
  var blog = req.body.blog;
  var sql = "UPDATE blog SET ? WHERE id = ?";
  
  connection.query(sql, [blog, req.params.id], function(err, updatedBlog){
    // connection.query("UPDATE blog SET body = 'UPDATE' WHERE id=5", function(err, result){
    if(err){
      console.log(err);
    } else {
      res.redirect("/blogs/" + req.params.id);
    }
  });
}); 

// DELETE ROUTE 
app.delete("/blogs/:id", function(req, res) {
  
  connection.query("DELETE FROM blog WHERE id=?", [req.params.id], function(err, result){
    if(err) {
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  });
});


app.listen(process.env.PORT, function () { 
  console.log("RESTful_BLOG_APP server is running on port " + process.env.PORT);
});

