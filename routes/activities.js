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

const admin = require('firebase-admin');

admin.initializeApp({

    credential: admin.credential.cert({
        projectId: "tourisme-1076-1146",
        clientEmail: "firebase-adminsdk-euh3g@tourisme-1076-1146.iam.gserviceaccount.com",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzLFbGcP6ioY5e\ntpZQiwiOdceXhAWOljUu/r/1vlCeAklZ4qo1PvGHVOBjoAoFU4USIgt0vch6ixwR\niA1xoESNk5wEg9rLfpOuRp6dEjNgUCZoqcJ2KYQiCm58EGklUViceU7adgWA1nex\ni36zCr2R5vEYAFDMNGB9dfDQ/AfsSf8QY5jh3CFFR6MXXXY47E2C//z6LB+d2ufz\nd6NX1Wv3mz/vZNV3AcGK+QmK/69jvM1Jp28nNHtgPjWyzEA5cKgftWas/RtAj7oE\n/X0qeFgssbVXjtfiRTZg4mIqKfw/un3t706I4RcfoDxhV3lX8UiIaG5JxNuEi9ml\nkR4oeskXAgMBAAECggEAAkok9679Ww79J26KTOV/r5Hz5GIxG0T/aEVcGc3VKFzi\n6YncInOYIWwv/StC8+E9tWy9ikaTnOrRc+3ZT8XYLHk9wRvjX4anOoaloSuAEJLd\nBDl8DlMehK7/ZDBsx410+eqB6Nc7nifDkFGE5t3zS6auKtzQBCCJ4x9RiIwyaqVI\nuJqjkm5tI/ArC+M/ho6UMyt6sEVfeA22e1Y9bcu1LgUI5EQ35JEARj1fBHipVdpc\nOscoz12BXFIatt1TfxB4xLkcmf2e7xrgYHPbzB5SQ/uQ1KoCKw9Xreg2M5rsJx3R\nLzlLB0ULSk2nybWDkT4v2JabPMG5UeeOlH2JpKJLEQKBgQDdRGazotRzrGDDJJvz\nY882dqhI0MwJNP9yzlrD+n8ry4BKEbSA5j6RYJCd2nE3rbEqPfJJLBi1P+MsgK3y\nqY4UUERVQb74PyrsyxtoWbpksnzo2bTVEA5sLtkkGy7kDh9yEc6VuEqdIOGkxQOE\nCYe2CCGVN962viGItYnM69DAxQKBgQDPTGUl2QtaC0eHMOX+zvvcf3QOr9KhjNEO\nxnYxmqhgF81qkNYbbDs1+nBYMLGf5zQWGjTP1tkmVZjbqNV1FihCjvUDXZ2B21QP\nyVaFwA7gis+1VL6DISJPkwYO8j+f0uLz7x8z4pu+roZl9MepkKeY7SGz6M0iFSsi\n0iVjupdIKwKBgG2u5ZYwpk386i5x7FiXZnViFoOZ9TqvKd3YSwgRGY81HpAY/LhU\n6jkYfDezvCHUmRkOghcho9HdLJi35QKAaGzLaUQ2Bht6/KVK/XgZ2prmG6M1oD1p\n6yxXgM40J2dnVNEv4I85PstrLE+IVfjS3JIwr60Pd/hwgaEKFJgfYWjdAoGBALhU\nAwDzjU+FBhZlWa4JGRXJU0aX+yBhmaecu46CKkRABg1DOs9pnwDxbyJMMjWwnbUl\nml5RegfHR0PTTfNuP2Bnw+A5RwwoHghnjIMj81agt+9SqpDpTpwZbOKvb/nKyLoF\nn+ZAEyMsBx/z1/KkSRMHkNdsI7OxxQiSemLCkTC/AoGAbf5cw3UxzuGkenCW3+1c\n2UaU7yFO4NNxpmYHKbDXEbU3jMguDtUT6X2Y/pM4h8Ph/3fILeOqFjx4rurQV7wD\nBxmTdQSAJ/mEZLClfu5ZR7K9GT31jpvWTXzBiy96oiymaODiCG0vRfEOaG9j4Pt1\ntg8Wd++WY/wB40043tkX+uY=\n-----END PRIVATE KEY-----\n",
    })
});


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

    const message = {
        notification: {
          title: 'Rappel',
          body: `Nouvel activite a visiter ajouté`
        },
      };
    
     /* admin.messaging().send(message).then(async (response) => {
         console.log('Successfully sent message:', response);
        
     }).catch((error) => {
        console.log('Error sending message:', error);
      }); */

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
