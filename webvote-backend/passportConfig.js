const Voters = require('./schemas/voters');
const Admins = require('./schemas/Admins');
const bcrypt = require('bcryptjs');
const localStrategy = require('passport-local').Strategy;

/*
--------------------------------passportConfig.js-----------------------------------------------------
This file is used to setup all the passport authentication required for voter and admin login
along with serialize and deserialize methods for session management.

Sections: - Passport local strategy for voter login
             :- This strategy accepts two parameters, username and password.
                First, the username is searched inside Voters schema under prNumber column.
                If it finds a match, then further the password is compared.
                Since the passwords are stored as hash in the database, bcrypt is used to compare
                the password provided and the one in the database found along the username match.
                If everything matches, the user is granted access to protected routes at react 
                front-end.
          - Serialize User(Admin/ Voter)
             :- When a user is logged in, its information is serialized into the session storage
                for validations and faster access to the data.
          - Deserialize User(Admin/ Voter)
             :- This functionality searches for the serialized user entry in both admin and voters
                schemas and if it finds a match, it returns all the data field that are mentioned
                as below in userInfo variable.
          - Passport local strategy for admin login
             :- This strategy is used specifically for admin login, and it works in similar way as the
                voter's local strategy.
---------------------------------------------------------------------------------------------------
*/

module.exports = function (passport) {
    
    //Passport local strategy for voter login
    passport.use(
        new localStrategy((username, password, done) => {
            Voters.findOne({ prNumber: username }, (err, user) => {
                if (err) throw err;
                if (!user) return done(null, false);
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) throw err;
                    if (result === true) {
                        return done(null, user);
                    }
                    else {
                        return done(null, false);
                    }
                });
            });
        })
    );

    //Serialize User(Admin/ Voter)
    passport.serializeUser((user, done) => {
        done(null, { _id: user.id, role: user.isAdmin });
    });

    //Deserialize User(Admin/ Voter)
    passport.deserializeUser((login, done) => {
        if (login.role) {
            Admins.findOne({ _id: login._id }, (err, user) => {
                const userInfo = {
                    username: user.username,
                    college: user.college,
                    isAdmin: user.isAdmin
                };
                done(err, userInfo);
            });
        }
        else if (!login.role) {
            Voters.findOne({ _id: login._id }, (err, user) => {
                const userInfo = {
                    prNumber: user.prNumber,
                    firstname: user.firstname,
                    middlename: user.middlename,
                    lastname: user.lastname,
                    gender: user.gender,
                    department: user.department,
                    college: user.college,
                    rollNumber: user.rollNumber,
                    password: user.password,
                    walletAddress: user.walletAddress,
                    isAdmin: user.isAdmin,
                    privateKey: user.privateKey
                };
                done(err, userInfo);
            });
        }
        else {
            done({ message: 'No entity found' }, null);
        }
    });

    //Passport local strategy for admin login
    passport.use('admin-local',
        new localStrategy((username, password, done) => {
            Admins.findOne({ username: username }, (err, user) => {
                if (err) throw err;
                if (!user) return done(null, false);
                bcrypt.compare(password, user.password, (err, result) => {
                    if (err) throw err;
                    if (result === true) {
                        return done(null, user);
                    }
                    else {
                        return done(null, false);
                    }
                });
            });
        })
    );
};