const bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  expressSanitizer = require('express-sanitizer'),
  bcrypt = require('bcryptjs'),
  mysql = require('mysql'),
  express = require('express'),
  // morgan = require('morgan'),  not working in production
  session = require('express-session'),
  flash = require('connect-flash'),
  MySQLStore = require('express-mysql-session')(session),
  authMiddleware = require('./middleware/auth'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

// MYSQL/DATABASE CONFIG
require('dotenv').config();
const { database } = require('./lib/keys');
const pool = require('./lib/database'); // use pool to get connection

// requiring routes
const blogRoutes = require('./routes/blogs'),
  indexRoutes = require('./routes/index'),
  manageRoutes = require('./routes/manage');

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
  SameSite: true,
  store: new MySQLStore(database)
}));

app.use(flash());
// app.use(morgan('dev')); not working in production
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
  
app.use(require('./middleware/tags-menu')); //sends tag array in each request for header partial to use


app.use("/", indexRoutes);
app.use("/blogs", blogRoutes);
app.use("/manage", manageRoutes);
// app.use("/campgrounds/:id/comments", commentRoutes);


app.get('/blogs/bjr', authMiddleware.isLoggedIn, (req, res) => {
  res.render('./blogs/bjr');
});

// catch any incorrect url instead of html code 
app.get('*', function(req, res) {
	req.flash('error', 'No page there champ');
  res.redirect("/blogs");
});

app.listen(process.env.PORT, function () { 
  console.log("RESTful_BLOG_APP server is running on port " + process.env.PORT);
});

