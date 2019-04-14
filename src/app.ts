import {
  AuthService,
  DbService,
  FaxService,
  EmailService,
  ViewEngineService,
  AuthController,
  ServerController,
  start,
  Server,
  SmsIrService,
  HttpService
} from "serendip";

import { join } from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

import { DataService } from "./services/DataService";

import { MongodbProvider } from "serendip-mongodb-provider";
import { ClientService } from "./services/ClientService";
import { AppointmentController } from "./controllers/AppointmentController";

Server.dir = __dirname;
dotenv.config();

DbService.configure({
  defaultProvider: "Mongodb",
  providers: {
    Mongodb: {
      object: new MongodbProvider() as any,
      options: {
        mongoDb: process.env["db.mongoDb"],
        mongoUrl: process.env["db.mongoUrl"],
        authSource: process.env["db.authSource"],
        user: process.env["db.user"],
        password: process.env["db.password"]
      }
    }
  }
});

DataService.FCM_SERVER_KEY =
  "AAAATGPOTDE:APA91bEZLMpk9j4BMI4g4TCPidg_l3FW8TlNu5w0bPZddMERkUcP6HUXFhfpHzoKfZWMUQ-SjawLkkvooBUzh7xLBzyiWYbiytPct10-1b-43bWwRuYq-viqBIpB5oJ1o_ofUKXR2N7W";

HttpService.configure({
  httpPort: (process.env.PORT as any) || 4400,
  // leave empty for iis !!!
  cors: process.env["http.cors"] || "",
  staticPath: join(__dirname, "../", "storage", "public"),
  controllers: [AppointmentController]
});

start({
  cpuCores: 1,
  services: [DbService, HttpService, DataService, ClientService]
})
  .then(() => {
    console.info("Server Start at " + new Date());
  })
  .catch(msg => console.error(msg));
