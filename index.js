const express = require('express');
const uuid = require('uuid/v4')
const session = require('express-session')
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const axios = require('axios');
const bcrypt2 = require('bcryptjs');
const bcrypt3 = require('bcrypt');
const bcrypt = require('bcrypt-nodejs');
// var baseUrl = `http://localhost:5000/users/`;
const User = require('./db.json');
const saltRounds = 10;

// configure passport.js to use the local strategy
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    (email, password, done) => {
        axios.get(`http://localhost:5000/users?email=${email}`)
            .then(res => {
                const user = res.data[0]
                if (!user) {
                    return done(null, false, { message: 'Invalid credentials.\n' });
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Invalid credentials.\n' });
                }
                return done(null, user);
            })
            .catch(error => done(error));
    }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    axios.get(`http://localhost:5000/users/${id}`)
        .then(res => done(null, res.data))
        .catch(error => done(error, false))
});

// create the server
const app = express();

// add & configure middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(session({
    genid: (req) => {
        return uuid() // use UUIDs for session IDs
    },
    store: new FileStore(),
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

// create the homepage route at '/'
app.get('/', (req, res) => {
    res.send(`You got home page!\n`)
})

// create the login get and post routes
app.get('/login', (req, res) => {
    res.send(`You got the login page!\n`)
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (info) { return res.send(info.message) }
        if (err) { return next(err); }
        if (!user) {
            console.log("login page");
            return res.redirect('/login');
        } else {
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (result == true) {
                    res.redirect('/');
                } else {
                    res.send('Incorrect password');
                    res.redirect('/');
                }
            })
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            console.log("authenticated");
            return res.redirect('/authrequired');
        })
    })(req, res, next);
})

app.get('/authrequired', (req, res) => {
    // console.log("response after authentication",res);
    if (req.isAuthenticated()) {
        res.send('you hit the authentication endpoint\n');
    } else {
        res.redirect('/');
    }
})

// // tell the server what port to listen on
// app.listen(3000, () => {
//     console.log('Listening on localhost:3000')
// })

app.post('/createuser', (req, res) => {
 
    console.log("<<<<<<<<<<<<<<<<<<<<");
    bcrypt3.hash(req.body.password, saltRounds, (err, hash)=> { 
        console.log(">>>>>>>>>>>>>>>>.",err);
        console.log(">>>>>>>>>>>>>>>>.",hash);
    //     console.log("Hassssssssss", req.body.password);
        axios.post(`http://localhost:5000/users`, {
   
            id: req.body.id,
            email: req.body.email,
            password: hash

            }).then((data) => {
                // if (data) {
                //     console.log("response after posting >>>>>>>>>>>>>>>>>>>>>>>>>", res);
                //     res.redirect('/')              
                // }
                return res.status(200).send({
                    success: 'true',
                    message: 'user added successfully',
                    
                });
            })
    })
      
    if (!req.body.email) {
        return res.status(400).send({
            success: 'false',
            message: 'email is required'
        });
    } else if (!req.body.id) {
        return res.status(400).send({
            success: 'false',
            message: 'description is required'
        });
    }

})

app.get('/getusers', (req, res) => {
    axios.get(`http://localhost:5000/users`, {


    }).then((res) => {
        console.log("get list of users", res);
    }).catch((err) => {
        console.log("error in getting list of data", err);
    })

    return res.status(200).send({
        success: 'true',
        message: 'user added successfull'
    })
})

app.listen(3000, () => {
    console.log("server is listening on port 3000");
})

