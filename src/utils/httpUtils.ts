
import { Application } from "express";
import http from "http";

export default function listenAsync(port: String,app:Application) {
  return new Promise((resolve, reject) => {
    app.listen(port)
      .once('listening', resolve)
      .once('error', reject);
  });
}