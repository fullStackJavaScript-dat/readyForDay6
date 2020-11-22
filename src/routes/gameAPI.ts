import express from "express";
const router = express.Router();
import gameFacade from "../facades/gameFacade";
import app from "../app";

let facadeInitialized = false;
router.use(async (req, res, next) => {
  if (!facadeInitialized) {
    const db = await app.get("database");
    await gameFacade.initDB(db);
  }
  next()
})
//Just to check this router is up and running
router.get('/', async function (req, res, next) {
  res.json({ msg: "game API" })
})

router.post('/nearbyplayers', async function (req, res, next) {
  try {
    throw new Error("Not yet implemented")
    //Read the exercise and check what must be sent with the request. Grab this information from the request body, and 
    //call the method (the skeleton is already there) nearbyPlayers(....) in the gameFacade and send back the result to the client

    /*const response = await gameFacade.nearbyPlayers(........)
    return res.json(response) */
  } catch (err) {
    next(err)
  }
})

router.post('/getPostIfReached', async function (req, res, next) {
  throw new Error("Not yet implemented")
})

module.exports = router;