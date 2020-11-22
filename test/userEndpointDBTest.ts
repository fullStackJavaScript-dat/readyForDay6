import path from "path";
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
import { expect } from "chai"
import { Server } from "http"
import http from "http"
import app from "../src/app"
const debug = require("debug")("user-endpoint-test");
import fetch from "node-fetch";
import { bryptAsync } from "../src/utils/bcrypt-async-helper"
import startServer from "../src/utils/httpUtils"
import { MongoMemoryServer } from "mongodb-memory-server"
import getTestDb from "../src/config/setupDB";
const testConnection = getTestDb({
  testServer: new MongoMemoryServer({ instance: { dbName: process.env.TEST_DB_NAME } }),
  app: app
})

let server: Server;

describe("####### Verify the User Endpoints (/api/users) ##########", function () {
  let URL: string;

  before(async function () {
    process.env["PORT"] = "7777"
    process.env["SKIP_AUTHENTICATION"] = "1";
 
    server = http.createServer(app);
    await startServer(process.env.PORT, app);

    const db = await testConnection.getDB();
    usersCollection = db.collection("users")
    URL = `http://localhost:${process.env.PORT}`;
  })

  after(async function () {
    server.close();
  })

  let usersCollection: any;

  beforeEach(async function () {
    await usersCollection.deleteMany({})
    const secretHashed = await bryptAsync("secret");
    const status = await usersCollection.insertMany([
      { name: "Peter Pan", userName: "pp@b.dk", password: secretHashed, role: "user" },
      { name: "Donald Duck", userName: "dd@b.dk", password: secretHashed, role: "user" },
      { name: "admin", userName: "admin@a.dk", password: secretHashed, role: "admin" }
    ])
  })

  it("Should get the message Hello", async () => {
    const result = await fetch(`${URL}/api/dummy`).then(r => r.json());
    expect(result.msg).to.be.equal("Hello")
  })

  it("Should get three users", async () => {
    const result = await fetch(`${URL}/api/users`).then(r => r.json());
    expect(result.length).to.be.equal(3)

  })

  it("Should Add the user Jan Olsen", async () => {
    const newUser = { name: "Jan Olsen", userName: "jo@b.dk", password: "secret", role: "user" }
    try {
      const config = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      }
      const result = await fetch(`${URL}/api/users`, config).then(r => r.json());
      const jan = await usersCollection.findOne({ userName: "jo@b.dk" })
      expect(jan).not.to.be.null
      expect(jan.name).to.be.equal("Jan Olsen")
    } catch (err) {
      console.log("----------------", err)
    } finally { }
  })

  it("Should find the user Donald Duck", async () => {
    const donald = await fetch(`${URL}/api/users/dd@b.dk`).then(r => r.json());
    expect(donald.userName).to.be.equal("dd@b.dk")
  })

  it("Should not find the user xxx@b.dk", async () => {
    try {
      const status: any = await fetch(`${URL}/api/users/xxx@b.dk`).then(r => {
        expect(r.status).to.be.equal(404)
        return r.json()  //Return the json (which will represent an error with a code and a message property )
      });
      expect(status.code).to.equal(404)
    } catch (err) {
      console.log("This should never happen", err)
    }
  })

  it("Should Remove the user Donald Duck", async () => {
    const config = {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    const s = await fetch(`${URL}/api/users/dd@b.dk`, config).then(r => r.json())
    expect(s.status).to.equal("User was deleted")

  })


})
