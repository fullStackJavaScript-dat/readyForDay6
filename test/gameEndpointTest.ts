import path from "path";
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
import { expect } from "chai";
import { Server } from "http";
import fetch from "node-fetch";
import { bryptAsync } from "../src/utils/bcrypt-async-helper"
import { positionCreator, getLatitudeInside, getLatitudeOutside } from "../src/utils/geoUtils"
import { USER_COLLECTION_NAME, POSITION_COLLECTION_NAME } from "../src/config/collectionNames"
import app from "../src/app"
import http from "http"
import startServer from "../src/utils/httpUtils"

import { MongoMemoryServer } from "mongodb-memory-server"
import getDB from "../src/config/setupDB";
const dbConnection = getDB({
  testServer: new MongoMemoryServer({ instance: { dbName: process.env.TEST_DB_NAME } }),
  app: app
})

let server: Server;
const TEST_PORT = "7778"
const DISTANCE_TO_SEARCH = 100


describe("Verify /gameapi/getPostIfReached", () => {
  let URL: string;
  let usersCollection: any;
  let positionsCollection: any;

  before(async function () {
    process.env["SKIP_AUTHENTICATION"] = "1";
    process.env["PORT"] = TEST_PORT;
    const db = await dbConnection.getDB()
    usersCollection = db.collection(USER_COLLECTION_NAME)
    positionsCollection = db.collection(POSITION_COLLECTION_NAME)
   
    server = http.createServer(app);
    await startServer(process.env.PORT,app);
   
    URL = `http://localhost:${process.env.PORT}`;
  })

  after(async function () {
    server.close();
  })

  beforeEach(async () => {
    await usersCollection.deleteMany({})
    const secretHashed = await bryptAsync("secret");
    const team1 = { name: "Team1", userName: "t1", password: secretHashed, role: "team" }
    const team2 = { name: "Team2", userName: "t2", password: secretHashed, role: "team" }
    const team3 = { name: "Team3", userName: "t3", password: secretHashed, role: "team" }

    const status = await usersCollection.insertMany([team1, team2, team3])

    await positionsCollection.deleteMany({})
    await positionsCollection.createIndex({ "lastUpdated": 1 }, { expireAfterSeconds: 30 })
    await positionsCollection.createIndex({ location: "2dsphere" })
    const positions = [
      positionCreator(12.48, 55.77, team1.userName, team1.name, true),
      //TODO --> Change latitude below, to a value INSIDE the radius given by DISTANCE_TO_SEARC, and the position of team1
      positionCreator(12.48, 55.77, team2.userName, team2.name, true),
      //TODO --> Change latitude below, to a value OUTSIDE the radius given by DISTANCE_TO_SEARC, and the position of team1
      positionCreator(12.48, 55.77, team3.userName, team3.name, true)
    ]
    const locations = await positionsCollection.insertMany(positions)
  })

  it("Should return true", async function () {
    expect(true).to.be.true
  })

  xit("Should find team2, since inside range", async function () {
    const newPosition = { "userName": "t1", "password": "secret", "lat": 55.77, "lon": 12.48, "distance": DISTANCE_TO_SEARCH }
    const config = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPosition)
    }
    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config).then(r => r.json());
    expect(result.length).to.be.equal(1)
    expect(result[0].name).to.be.equal("Team2")
  })

  xit("Should find team2 +team3, since both are inside range", async function () {
    //TODO
  })

  xit("Should NOT find team2, since not in range", async function () {
    //TODO
  })

  xit("Should NOT find team2, since since credentials are wrong", async function () {
    //TODO
  })

  xit("Should .....", async () => {
  })


})