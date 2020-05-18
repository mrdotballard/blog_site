const bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  expressSanitizer = require('express-sanitizer'),
  bcrypt = require('bcryptjs'),
  mysql = require('mysql'),
  express = require('express'),
  morgan = require('morgan'),
  session = require('express-session'),
  flash = require('connect-flash'),
  MySQLStore = require('express-mysql-session')(session),
  authMiddleware = require('./middleware/auth'),
  passport = require('passport'),
  // passport = require('./lib/passport-strategy'),
  LocalStrategy = require('passport-local').Strategy;

// MYSQL/DATABASE CONFIG
require('dotenv').config();
const { database } = require('./lib/keys');
const pool = require('./lib/database'); // use pool to get connection

//  APP INITIALISE
const app = express();

// import simply makes code available here
// i.e. this requrie doesn't return anything via module.exports
require('./lib/passport-strategy'); 

// APP CONFIG
app.set('port', process.env.PORT);
// app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); // needed?

// MIDDLEWARES
app.use(session({
  secret: 'mysessionsecretabc123',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(database)
}));
app.use(flash());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(expressSanitizer()); //html sanitizer


app.use(passport.initialize());
app.use(passport.session());

// GLOBAL
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  app.locals.user = req.user; 
  next();
});


// RESTFUL ROUTES CONFIG
app.get("/", function(req, res) {
  res.redirect("/blogs");
});

// AUTH ROUTE
app.get('/login', (req, res) => {
  console.log(req.flash());
  res.render("login");
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/blogs',
  failureRedirect: '/login',
  failureFlash: true,
  successFlash: true
})
);

app.get('/logout', function(req, res) {
  req.logout();
  req.flash("success", "You're logged out");
  res.redirect('/blogs');
});

app.get('/blogs/bjr', isLoggedIn, (req, res) => {
  res.render('./blogs/bjr');
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    next();
  } else{
    req.flash('error', 'You must be logged in to view this page');
    res.redirect('/login');
  }
}

// REGISTER ROUTE
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
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

// INDEX ROUTE
app.get("/blogs", (req, res) => {
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
app.get("/blogs/new", function(req, res){
  res.render("./blogs/new");
});

app.post("/blogs", async (req, res, done) => {
    // 1) Create bog
  // req.body.blog.body = req.sanitize(req.body.blog.body);
  
  var post = req.body.blog;
  console.log("req.body.blog: " + typeof(post));
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
app.get("/blogs/:blog_id", function(req, res){
  
  // find sql entry in db
    pool.query('SELECT * FROM blog WHERE blog_id=?', [req.params.blog_id], function(err, result){
      if(err){
        console.log("error thrown: " + err);
        res.redirect("/blogs");
      } else{
        res.render("./blogs/show", {blog: result[0]}); 
      }
    });

  // else redirect to index (/blogs)
});
 
 
// EDIT ROUTE
app.get("/blogs/:blog_id/edit", function(req, res) {
  pool.query('SELECT * FROM blog WHERE blog_id=?', [req.params.blog_id], function(err, result){
    if(err){
      console.log("error thrown: " + err);
      res.redirect("/blogs"); 
    } else{
      
    res.render("./blogs/edit", {blog: result[0]}); 
    }
  }); 
});


// UPDATE ROUTE
app.put("/blogs/:blog_id", function(req, res) {
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
app.delete("/blogs/:blog_id", function(req, res) {
  
  pool.query("DELETE FROM blog WHERE blog_id=?", [req.params.blog_id], function(err, result){
    if(err) {
      res.redirect("/blogs/bjr");
    } else {
      res.redirect("/blogs");
    }
  });
});


app.listen(process.env.PORT, function () { 
  console.log("RESTful_BLOG_APP server is running on port " + process.env.PORT);
});

