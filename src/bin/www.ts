import app from "../app";
const debug = require('debug')('game-project');
import http from "http"
import setupDB from "../config/setupDB"
const PORT = process.env.PORT || 3333;

var server = http.createServer(app);
setupDB({ app }).getDB()
  .then(() => {
    server.listen(PORT, () => debug(`Server started, listening on port ${PORT}`));
  })



