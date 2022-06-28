# Full Stack with PG

[PG](https://www.npmjs.com/package/pg) is a node module that allows us to communicate with our PostgreSQL database.

PG lives between the server and database:

```
,________,         .------,            .------,                  .------.
|________|       ,'_____,'|    req > ,'_____,'|                 (        )
|        |       |      | |          | ____ | |       PG        |~------~|
|        |       |      | | - AJAX - | ____ | |    <------->    |~------~|
|        |       |      | ;          | ____ | ;                 |~------~|
|________|       |______|'   < res   |______|'                  `.______.'
 HTML/CSS          jQuery          Node / Express               PostgreSQL
```

## Accessing our database from Node with PG
From our code's point of view, we need a way to talk to our new database server and tables. We need to connect to our database server before issuing queries. We will be using an npm package called `pg`.

Add it to our application dependencies: `$ npm install pg`

```JavaScript
const express = require('express');
const bodyParser = require('body-parser');
const pg = require('pg');

// Setup PG to connect to the database
const Pool = pg.Pool;
const pool = new Pool({
    database: 'songs', // the name of database, This can change!
    host: 'localhost', // where is your database?
    port: 5432, // the port for your database, 5432 is default for postgres
    max: 10, // how many connections (queries) at one time
    idleTimeoutMillis: 30000 // 30 second to try to connect, otherwise cancel query
});

// .on here looks familiar...this is how node can handle arbitrary events
// this is NOT required but it is very useful for debugging
pool.on('connect', () => {
    console.log('Postgresql connected');
});

// the pool with emit an error on behalf of any idle clients
// it contains if a back end error or network partition happens
pool.on('error', (error) => {
    console.log('Error with postgres pool', error)
});

// Setup express (same as before)
const app = express();

// Setup body parser - to translating request body into JSON
app.use( bodyParser.urlencoded({ extended: true }));
app.use( bodyParser.json() );
app.use(express.static('server/public'));

// Routes would go here

// Start express
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('up and running on port', PORT);
});
```

## GET ROUTE
Let's setup a GET route to send back all of the songs in our database.

```JavaScript
router.get('/', (req, res) => {
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
```

> We can test this route using Postman!


## POST Route
Let's setup a POST route to add a new song to the database.

We could do something like this...
```JavaScript
router.post('/', (req, res) => {
    const newSong = req.body;
    const queryText = `INSERT INTO songs (artist, track, published) 
        VALUES (${newSong.artist}, ${newSong.track}, ${newSong.published});`;
    pool.query(queryText)
        .then((result) => {
            res.sendStatus(201);
        })
        .catch((err) => {
            console.log(`Error making query ${queryText}`, err);
            res.sendStatus(500);
        });
});
```

__BUT__ this doesn't take sanitization of our user input into account. A malicious user could throw something like `DROP TABLE "songs"` in as the name of the song, and we could be in trouble. 

> Classic xkcd - Bobby Tables: https://xkcd.com/327/


PG does sanitization nicely for us, so we just need to structure our query like this:

```JavaScript
    const newSong = req.body;
    const queryText = `INSERT INTO songs (artist, track, published) 
        VALUES ($1, $2, $3);`;
    pool.query(queryText, [newSong.artist, newSong.track, newSong.published])
```


## Modularizing

### Making a Connection Module
This code could be in *any* module we wanted to talk to our database, but centralizing it in its own module is the D-R-Y way.

>You'll need to use environment variables in order to deploy your pg-pool configuration to deploy to Heroku. That is not covered here.

**modules/pool.js**
```JavaScript
const pg = require('pg');
const Pool = pg.Pool;
const config = {
  database: 'songs', // the name of the database
  host: 'localhost', // where is your database
  port: 5432, // the port number for your database, 5432 is the default
  max: 10, // how many connections at one time
  idleTimeoutMillis: 30000 // 30 seconds to try to connect
};

// create a new pool instance to manage our connections
const pool = new Pool(config);

// .on here looks familiar...this is how node can handle arbitrary events
// this is NOT required but it is very useful for debugging
pool.on('connect', (client) => {
  console.log('PostgeSQL connected');
})

// the pool with emit an error on behalf of any idle clients
// it contains if a back end error or network partition happens
pool.on('error', (err, client) => {
  console.log('Unexpected error on idle client', err);
});

// need to allow access to this pool instance to other code
module.exports = pool;
```

### Making a Router Module

**routes/shoes-router.js**
```JavaScript
// bring in our modules
const pool = require('../modules/pool.js');
const express = require('express');
const router = express.Router();

// When using a router, the part of the path we used to get here is removed.
// We called http://localhost:5000/songs/ to get here (e.g. '/').
router.get('/', (req, res) => {
    let queryText = 'SELECT * FROM songs;';
    pool.query(queryText)
        .then((result) => {
            res.send(result.rows);
        })
        .catch((err) => {
            console.log(`Error making query ${queryText}`, err);
            res.sendStatus(500);
        });
}); // END GET route


router.post('/', (req, res) => {
    const newSong = req.body;
    const queryText = `INSERT INTO songs (artist, track, published) 
        VALUES (${newSong.artist}, ${newSong.track}, ${newSong.published});`;
    pool.query(queryText)
        .then((result) => {
            res.sendStatus(201);
        })
        .catch((err) => {
            console.log(`Error making query ${queryText}`, err);
            res.sendStatus(500);
        });
}); // END POST route

module.exports = router;
```
