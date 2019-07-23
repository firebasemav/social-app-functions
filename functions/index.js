const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')();
admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyBuBYpg4S4ZyA9WGk7SoiY1TaE1Ezm8iO8",
    authDomain: "social-app-ecb54.firebaseapp.com",
    databaseURL: "https://social-app-ecb54.firebaseio.com",
    projectId: "social-app-ecb54",
    storageBucket: "social-app-ecb54.appspot.com",
    messagingSenderId: "314927917247",
    appId: "1:314927917247:web:937e386225600418"
};

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req, res) => {
    db
    .firestore()
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
        let screams = [];
        data.forEach((doc) => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(screams);
    })
    .catch((err) => console.error(err));
})

app.post('/scream' , (req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    db.firestore()
        .collection('screams')
        .add(newScream)
        .then(doc => {
            res.json({ message: `document ${doc.id} created successfully`});
        })
        .catch(err => {
            res.status(500).json({error: 'something went wrong'})
            console.error(err);
        })
});

app.post('/signup', (req,res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }

    let token, userId;

    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                return res.status(400).json({ handle: 'this handle is already taken '});
            } else{
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            }
           return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return res.status(400).json({ email: 'Email is already in use'});
            } else{
                return res.status(500).json({ error: err.code });
            }
        })
});

exports.api = functions.region('asia-east2').https.onRequest(app);