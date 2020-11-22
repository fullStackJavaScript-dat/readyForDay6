import express, { json } from "express";
import userFacade from "../facades/userFacadeWithDB";
import basicAuth from "../middlewares/basic-auth"
const debug = require("debug")("user-endpoint");
const router = express.Router();
import { ApiError } from "../errors/apiError"
import authMiddleware from "../middlewares/basic-auth";
import app from "../app";

const USE_AUTHENTICATION = !process.env["SKIP_AUTHENTICATION"];


let facadeInitialized = false;
router.use(async (req, res, next) => {
  if (!facadeInitialized) {
    const db = await app.get("database");
    await userFacade.initDB(db);
  }
  next()
})

router.post('/', async function (req, res, next) {
  try {
    let newUser = req.body;
    newUser.role = "user";  //Even if a hacker tried to "sneak" in his own role, this is what you get
    const status = await userFacade.addUser(newUser)
    res.json({ status })
  } catch (err) {
    JSON.stringify(err)
    next(new ApiError(err.message, 400));
  }
})

if (USE_AUTHENTICATION) {
  router.use(authMiddleware)
}
router.get('/:userName', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      console.log(role)
      if (role != "admin") {
        throw new ApiError("Not Authorized", 403)
      }
    }
    const user_Name = req.params.userName;
    const user = await userFacade.getUser(user_Name);
    if (user == null) {
      throw new ApiError("User not found", 404)
    }
    const { name, userName } = user;
    const userDTO = { name, userName }
    res.json(userDTO);
  } catch (err) {
    next(err)
  }
});

if (USE_AUTHENTICATION) {
  router.get('/user/me', async function (req: any, res, next) {
    try {
      const user_Name = req.userName;
      const user = await userFacade.getUser(user_Name);
      const { name, userName } = user;
      const userDTO = { name, userName }
      res.json(userDTO);
    } catch (err) {
      next(err)
    }
  });
}


router.get('/', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      if (role != "admin") {
        throw new ApiError("You are not Authorized with your given Role", 403)
      }
    }
    const users = await userFacade.getAllUsers();
    const usersDTO = users.map((user) => {
      const { name, userName } = user;
      return { name, userName }
    })
    return res.json(usersDTO);
  } catch (err) {
    next(err)
  }
});

router.delete('/:userName', async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION) {
      const role = req.role;
      if (role != "admin") {
        throw new ApiError("Not Authorized", 403)
      }
    }
    const user_name = req.params.userName;
    const status = await userFacade.deleteUser(user_name)
    res.json({ status })
  } catch (err) {
    next(err);
  }
})

module.exports = router;