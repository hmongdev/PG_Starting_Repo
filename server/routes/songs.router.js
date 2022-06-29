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

//GET = keep the whack, don't add anything
router.get('/', (req, res) => {
    //
    let queryText = 'SELECT * FROM songs;';
    pool.query(queryText)
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(`Error making query ${queryText}`, err);
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

router.get('/', (req, res) => {
    res.send(songs);
});

//POST: client => server
router.post('/', (req, res) => {
    // songs.push(req.body);
    // res.sendStatus(200);

    // assign req.body to newSong
    const newSong = req.body;
    // assign query to queryText
    // this is the query we WOULD be putting into the database
    const queryText = `
            INSERT INTO "songs" ("artist", "track", "published", "rank")
            VALUES ('${newSong.artist}', '${newSong.track}', '${newSong.published}');
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

module.exports = router;
