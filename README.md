## first thing you should do is to create af file `.env` in the root of the project with this content

CONNECTION=YOUR_CONNECTION_STRING_TO_ATLAS

DB_NAME=semester_case

PORT=5555

DEBUG=game-project,facade-no-db,facade-with-db,facade-with-db:test,user-endpoint,user-endpoint-test,db-setup

### Comment out, or remove, this line to get authentication
#### SKIP_AUTHENTICATION=xxxx


MOCHA_TIMEOUT=5000

## HINTS

### Remember you can run individual typescript files using ts-node like this:

`ts-node -r dotenv/config ./src/PATH_TO_FILE`

# How to get and use a database connection
### Simple
```js
import setupDB from "../config/setupDB"
const connection = setupDB();

...
const db = await connection.getDB()
.....
await connection.close()
```

### Passing the Express app object, will provide access to the database everywhere

```js
import app from "../app";
import setupDB from "../config/setupDB"
    
connection = await setupDB({ app });

// Somewhere else
import app from "../app";
const db = app.get("database");
```
### Using an in-memory database for testing
*The examples given above will use the connection details given in `.env`*

The example below, shows how to change that to use an in-memory database.
You can still pass in the app object, as in the previous example if needed.

```js
import { MongoMemoryServer } from "mongodb-memory-server"
import setupDB from "../src/config/setupDB";
const testConnection = setupDB({
  testServer: new MongoMemoryServer({ instance: { dbName: process.env.TEST_DB_NAME } })
})
```    
