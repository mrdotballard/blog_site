// const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// we can require database.js at any time for access to pooled connections to DB
const pool = require('./database');
const bcrypt = require('./bcrypt-helper');

// *** Below equivelent of Mongoose schema models.
// So two strategies created here, login and signup ***
module.exports = function(passport) {
passport.use('local.login', new LocalStrategy(
    {
        username: 'username',
        password: 'password',
        passReqToCallback: true
    },
    async (req, username, password, done) => {
        const rows = await pool.query("SELECT * FROM user WHERE username = ?", [username]);

        if (rows.length > 0) {
            const user = rows[0];
            const validPassword = await bcrypt.matchPassword(password, user.password);

            if(validPassword) {
                done(null, user, req.flash("success", "Welcome " + user.first_name));
            } else {
                done(null, false, req.flash("message", "Incorrect Passowrd"));
            }

        } else {
            return done(null, false, req.flash("message", "Username does not exist"));
        }
    }
));

passport.use('local-register', new LocalStrategy(
    {
        username: 'username',
        password: 'passowrd',
        passReqToCallback: true
    },
    (req, username, password, done) => {
        // let variables can be reassigned, const cannot
        // const { firstName, lastName, email } = req.body;
        let newUser = {};
        newUser.username = req.body.username;
        newUser.password = req.body.password;
        newUser.first_name = req.body.firstName;
        newUser.last_name = req.body.lastName;
        newUser.email = req.body.email;

        newUser.password = bcrypt.encryptPassword(password);

        // save to DB
        // const result = await pool.query("INSERT INTO user SET ? ", newUser);
        // newUser.userID = result.insertID;
        // return done(null, newUser);

        pool.query('INSERT INTO user SET ?', newUser, function(err, result) {
            if (err) throw err;
            
            newUser.user_id = result.insertID;
            console.log("User written to DB");

            return done(null, newUser);
          });
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    pool.query("SELECT * FROM user WHERE user_id = ? ", [id], (err, result) => {
        if (err) { return done(err); }

        done(null, result[0]);
    });
});
};