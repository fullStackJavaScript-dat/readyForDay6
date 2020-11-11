const path = require('path')
require('dotenv').config({ path: path.join(process.cwd(), '.env') })
const debug = require("debug")("facade-with-db");
import IGameUser from '../interfaces/GameUser';
import { bryptAsync, bryptCheckAsync } from "../utils/bcrypt-async-helper"
import * as mongo from "mongodb"
import { getConnectedClient, closeConnection } from "../config/setupDB"
import { ApiError } from "../errors/apiError"

let userCollection: mongo.Collection;

export default class UserFacade {

  static dbIsReady = false;

  /*
  This method MUST be called before using the facade
  */
  static async initDB(client: mongo.MongoClient) {

    const dbName = process.env.DB_NAME;
    //debug(`Database ${dbName} about to be setup: ${client}`)
    if (!dbName) {
      throw new Error("Database name not provided")
    }
    try {
      userCollection = await client.db(dbName).collection("users");
      debug(`userCollection initialized on database '${dbName}'`)

    } catch (err) {
      debug("Could not create connection", err)
    }
    UserFacade.dbIsReady = true
  }


  static isDbReady() {
    if (!UserFacade.dbIsReady) {
      throw new Error(`######## initDB MUST be called BEFORE using this facade ########`)
    }
  }


  static async addUser(user: IGameUser): Promise<string> {
    UserFacade.isDbReady()
    const hash = await bryptAsync(user.password);
    let newUser = { ...user, password: hash }
    const result = await userCollection.insertOne(newUser);
    return "User was added";
  }

  static async deleteUser(userName: string): Promise<string> {
    UserFacade.isDbReady()
    const status = await userCollection.deleteOne({ userName })
    if (status.deletedCount === 1) {
      return "User was deleted"
    }
    throw new ApiError("User could not be deleted", 400);
  }
  //static async getAllUsers(): Promise<Array<IGameUser>> {
  static async getAllUsers(proj?: object): Promise<Array<any>> {
    UserFacade.isDbReady()
    const users = await userCollection.find(
      {},
      { projection: proj }).toArray()

    return users;
  }

  static async getUser(userName: string, proj?: object): Promise<any> {
    UserFacade.isDbReady()
    const user = await userCollection.findOne({ userName });
    return user;
  }

  static async checkUser(userName: string, password: string): Promise<boolean> {
    UserFacade.isDbReady()
    let userPassword = "";
    let user;
    user = await UserFacade.getUser(userName);
    if (user == null) {
      return Promise.reject(false);
    }
    userPassword = user.password;
    const status = await bryptCheckAsync(password, userPassword);
    return status
  }
}

async function test() {
  const client = await getConnectedClient();
  //process.env["DB_NAME"] = "semester_case_test"
  await UserFacade.initDB(client);

  await userCollection.deleteMany({})
  await UserFacade.addUser({ name: "kim-admin", userName: "kim@b.dk", password: "secret", role: "admin" })
  await UserFacade.addUser({ name: "ole", userName: "ole@b.dk", password: "secret", role: "user" })

  //const projection = { projection: { _id: 0, role: 0, password: 0 } }
  /*
  const projection = { _id: 0, role: 0, password: 0 }
  const all = await UserFacade.getAllUsers(projection);
  debug(all)
  debug(`Number of users: ${all.length}`)
*/

  //client.close();
  // const projection = {projection:{_id:0, role:0,password:0}}
  // const kim = await UserFacade.getUser("kim@b.dk",projection)
  // debug(kim)

  // try {
  //   let status = await UserFacade.deleteUser("kimxxx@b.dk");
  //   debug("----", status)
  //   // status = await UserFacade.deleteUser("xxxx@b.dk");
  //   // debug("Should not get here")
  // } catch (err) {
  //   debug("ERROR", err.message)
  // }

  // try {
  //     const passwordStatus = await UserFacade.checkUser("kim@b.dk", "secret");
  //     debug("Expects true: ", passwordStatus)
  // } catch (err) {
  //     debug("Should not get here 1", err)
  // }
  // try {
  //     const passwordStatus = await UserFacade.checkUser("kim@b.dk", "xxxx");
  //     debug("Should not get here ", passwordStatus)
  // } catch (err) {
  //     debug("Should get here with failded 2", err)
  // }
  // try {
  //     const passwordStatus = await UserFacade.checkUser("xxxx@b.dk", "secret");
  //     debug("Should not get here")
  // } catch (err) {
  //     debug("hould get here with failded 2", err)
  // }
  // await closeConnection()
  //debug("Done, and connection was closed")

}
//test();
