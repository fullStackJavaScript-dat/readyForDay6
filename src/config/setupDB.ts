import path from "path";
import { MongoMemoryServer } from "mongodb-memory-server"
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
const debug = require("debug")("db-setup");
import { MongoClient, Db } from "mongodb";
import { Application } from "express"

/*
 Interfaces to provide code-completion for this package
*/
interface Settings {
  testServer?: MongoMemoryServer,
  app?: Application
}
interface IReturnDB { (): Promise<Db> }
interface IVoidPromise { (): Promise<any> }

interface IDatabase {
  getDB: IReturnDB
  stop: IVoidPromise
}

const connectionStr = process.env.CONNECTION || ""

function getDataBaseConnection(settings?: Settings): IDatabase {
  let connection: any
  let db: Db

  async function getDB(): Promise<Db> {
    if (db) {
      return db
    }
    let inMemoryUri;
    if (settings && settings.testServer) {
      inMemoryUri = await settings.testServer.getUri();
      debug("Using the provided test database")
    }
    const uri = inMemoryUri ? inMemoryUri : connectionStr;
    connection = await new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true }).connect();
    db = await connection.db(process.env.DB_NAME)
    if (settings && settings.app) {
      settings.app.set("database", db)
      settings.app.set("stopMethod", connection.stop)
    }
    return db
  }

  async function stop(): Promise<any> {
    await connection.close()
  }

  return {
    getDB,
    stop
  }
}

export default getDataBaseConnection;