var express = require('express');
var router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require("mongodb").ObjectId;
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'Aucun token, autorisation refusée' });
    }

    try {
        const decoded = jwt.verify(token, "Tsanta");
        console.log(decoded);
        req.user = decoded;
        next();
    } 
    catch (err) {
        res.status(400).json({ message: 'Token non valide' });
    }
}

const CONNECTION_STRING = 'mongodb+srv://tsanta:ETU001146@cluster0.6oftdrm.mongodb.net/?retryWrites=true&w=majority';

router.post('/', auth, async (req, res) => {
    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");

    const activityExists = await db.collection("activities").findOne({ titre: req.body.titre });
    if (activityExists) {
        return res.status(400).json({ message: "Cette activities ou site existe déjà" });
    }

    const newActivity = req.body;

    await db.collection("activities").insertOne(newActivity);

    res.status(201).json({ activite: newActivity, message: "Activité déposé avec succès" });

    client.close();
});

router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");
    
    await db.collection("activities").updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    res.status(200).json({ message: "Activity updated successfully" });

    client.close();
});

router.get('/', auth, async (req, res) => {
    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");
    
    const activities = await db.collection("activities").find().toArray();

    activities.forEach(activity => {
        const totalEtoiles = activity.etoiles.reduce((acc, current) => acc + parseInt(current[1].$numberInt), 0);
        activity.averageEtoiles = activity.etoiles.length ? totalEtoiles / activity.etoiles.length : 0;
        activity.voteCount = activity.etoiles.length;
    });

    res.status(200).json(activities);

    client.close();
});

router.get('/:id', auth, async (req, res) => {
    const { id } = req.params;

    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");
    
    const activity = await db.collection("activities").findOne({ _id: new ObjectId(id) });
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const totalEtoiles = activity.etoiles.reduce((acc, current) => acc + parseInt(current[1].$numberInt), 0);
    activity.averageEtoiles = activity.etoiles.length ? totalEtoiles / activity.etoiles.length : 0;
    activity.voteCount = activity.etoiles.length;

    res.status(200).json(activity);

    client.close();
});


router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");
    
    await db.collection("activities").deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: "Activity deleted successfully" });

    client.close();
});


router.put('/:id/vote', auth, async (req, res) => {
    const { id } = req.params; // Activity ID
    const userId = req.user.id; // User ID from decoded JWT
    const { vote } = req.body; // The vote value
    
    if (vote === undefined) {
        return res.status(400).json({ message: "Please provide a vote" });
    }

    const client = new MongoClient(CONNECTION_STRING, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("Tourism");

    const activity = await db.collection("activities").findOne({ _id: new ObjectId(id) });

    if (!activity) return res.status(404).json({ message: "Activity not found" });

    const existingVoteIndex = activity.etoiles.findIndex(e => e[0] === userId);

    if (existingVoteIndex > -1) {
        activity.etoiles[existingVoteIndex][1].$numberInt = String(vote);
    } else {
        activity.etoiles.push([userId, {"$numberInt": String(vote)}]);
    }

    await db.collection("activities").updateOne(
        { _id: new ObjectId(id) },
        { $set: { etoiles: activity.etoiles } }
    );

    res.status(200).json({ message: "Vote updated successfully" });

    client.close();
});


module.exports = router;
