const { response } = require('express');
const express = require('express');
const router = express.Router();
//postgresql
const pg = require('pg'); // Import just what we need

const Pool = pg.Pool;

const pool = new Pool({
    database: 'music_library', // the name of database, This can change!
    host: 'localhost', // where is your database?
    port: 5432, // the port for your database, 5432 is default for postgres
    max: 10, // how many connections (queries) at one time
    idleTimeoutMillis: 30000, // 30 second to try to connect, otherwise cancel query
});

// .on here looks familiar...this is how node can handle arbitrary events
// NOT required, but useful for debugging
pool.on('connect', () => {
    console.log('Postgresql Connected!');
});

// the pool with emit an error on behalf of any idle clients
// it contains if a back end error or network partition happens
// NOT required, but useful for debugging
pool.on('error', (error) => {
    console.log('Error with postgres:', error);
});

//GET request
router.get('/', (req, res) => {
    let queryText = 'SELECT * FROM "songs" ORDER BY "rank";';
    pool.query(queryText)
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(`GET error making query ${queryText}`, err);
            res.sendStatus(500);
        });
});

//GET
//Concept: grab a specific song with a specific id
// 1. change the route from '/' to '/:id'
// example: /songs/:id
router.get('/:id', (req, res) => {
    //2. create your dynamic route by id -- can only be letters and numbers
    const idToGet = req.params.id;
    //3. create your query params
    let queryText = 'SELECT * FROM songs WHERE id=$1;';
    //4. add [idToGet] into pool.query() => sends id to database (parse sql query)
    pool.query(queryText, [idToGet])
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(`GET error making query ${queryText}`, err);
            res.sendStatus(500);
        });
});

//DELETE request
//1. DELETE can use the SAME URL as the GET request
router.delete('/:id', (req, res) => {
    //2. define reqId
    let reqId = req.params.id;
    console.log('Delete request for id', reqId);
    //2. define query -- don't need double quotes but it's for safety
    let queryText = 'DELETE FROM "songs" WHERE id = $1;';
    //3. pool.query to send (queryText, [reqId])
    pool.query(queryText, [reqId])
        //4. if row is SUCESSFULLY deleted, then...
        .then(() => {
            console.log('Song deleted');
            res.sendStatus(200); //DELETED!!!
        })
        //5. if row FAILED to delete, then...
        .catch((error) => {
            console.log(`Error DELETEing with query ${queryText}`, error);
            res.sendStatus(500); // 500 is SERVER ERROR
        });
});

// Concept: Grabbing artist
// 1. change the route from '/' to '/artist/:id'
// example: /songs/artist/Mahmoud
router.get('/artist/:artist', (req, res) => {
    //2. create your dynamic route by artist -- can only be letters and numbers
    const artistToGet = req.params.artist;
    //3. filter your query params
    let queryText = 'SELECT * FROM song WHERE artist = $1;';
    //4. add [idToGet] into pool.query() => send artist to database
    pool.query(queryText, [artistToGet])
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(`GET error making query ${queryText}`, err);
            res.sendStatus(500);
        });
});

let songs = [
    {
        rank: 355,
        artist: 'Ke$ha',
        track: 'Tik-Toc',
        published: '1/1/2009',
    },
    {
        rank: 356,
        artist: 'Gene Autry',
        track: 'Rudolph, the Red-Nosed Reindeer',
        published: '1/1/1949',
    },
    {
        rank: 357,
        artist: 'Oasis',
        track: 'Wonderwall',
        published: '1/1/1996',
    },
];

//POST: client => server
router.post('/', (req, res) => {
    // songs.push(req.body);
    // res.sendStatus(200);

    // assign req.body to newSong
    const newSong = req.body;
    // assign query to queryText
    // this is the query we WOULD be putting into the database
    const queryText = `
            INSERT INTO "songs" ("artist", "track", "published", "rank") VALUES ($1, $2, $3, $4);
        `;
    // checking the queryText to make sure it's the newSong we're sending in!
    console.log(`The query we're sending to postgres:`, queryText);
    //this looks like AJAX! But it looks like we're handling it in the router now
    pool.query(queryText)
        //if successful, do this!
        //don't send back data in the POST
        .then((result) => {
            res.sendStatus(201);
        })
        //if error, do this!
        .catch((err) => {
            console.log(`Error POSTing to db ${queryText}`, err);
            //error status
            res.sendStatus(500);
        });
});

// Change rank on my song - body will say up or down
router.put('/rank/:id', (req, res) => {
    let songId = req.params.id;
    // Direction will come from the request body
    // Drection expected to be up/down
    let direction = req.body.direction;
    // declare queryText
    let queryText;

    if (direction === 'up') {
        // use rank-1, so it get's closer to the awesome rank of 1
        queryText = `UPDATE "songs" SET rank = rank-1 WHERE id=$1`;
    } else if (direction == 'down') {
        queryText = `UPDATE "songs" SET rank = rank+1 WHERE id=$1`;
    } else {
        // If we don't get an expected direction, send back bad status
        res.sendStatus(500);
        return; // Do it now, don't run code below //exit function on server
    }
    //send => database
    pool.query(queryText, [songId])
        .then((dbResponse) => {
            //.rows just sends the rows from database
            res.send(dbResponse.rows);
        })
        .catch((err) => {
            console.log(`Error UPDATEing with query: ${err.message} ${err}`);
            //error status code
            res.sendStatus(500);
        });
});

module.exports = router;
