var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require("mongodb").ObjectId;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

router.get('/', function(req, res, next) { res.send('USER'); });

router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const client = new MongoClient('mongodb+srv://tsanta:ETU001146@cluster0.6oftdrm.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");
    let user = await db.collection("users").findOne({ email: email });
    if (!user) { return res.status(401).json({ message: "Utilisateur non trouvé" }); }
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) { return res.status(401).json({ message: "Mot de passe incorrect" }); }
    const token = jwt.sign({ id: user._id }, "Tsanta", { expiresIn: 86400 });
    res.status(200).json({ user: user, token: token });
    client.close();
});

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

router.post('/register', async (req, res) => {

    const nom = req.body.nom;
    const prenom = req.body.prenom;
    const email = req.body.email;
    const password = req.body.password;
    const passwordConf = req.body.passwordConf;

    if (password !== passwordConf) {
        return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
    }

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Adresse e-mail non valide" });
    }

    const client = new MongoClient('mongodb+srv://tsanta:ETU001146@cluster0.6oftdrm.mongodb.net/?retryWrites=true&w=majority', { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");

    const emailExists = await db.collection("users").findOne({ email: email });

    if (emailExists) {
        return res.status(400).json({ message: "Cette adresse e-mail est déjà utilisée" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = {
        nom: nom,
        prenom: prenom,
        email: email,
        password: hash,
    };

    const { insertedId } = await db.collection("users").insertOne(newUser);
    const token = jwt.sign({ id: insertedId }, "Tsanta", { expiresIn: 86400 });
    res.status(200).json({ user: newUser, token: token });
    client.close();
});




module.exports = router;


