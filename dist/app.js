"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serendip_1 = require("serendip");
const path_1 = require("path");
const dotenv = require("dotenv");
const DataService_1 = require("./services/DataService");
const serendip_mongodb_provider_1 = require("serendip-mongodb-provider");
const ClientService_1 = require("./services/ClientService");
const AppointmentController_1 = require("./controllers/AppointmentController");
serendip_1.Server.dir = __dirname;
dotenv.config();
serendip_1.DbService.configure({
    defaultProvider: "Mongodb",
    providers: {
        Mongodb: {
            object: new serendip_mongodb_provider_1.MongodbProvider(),
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
DataService_1.DataService.FCM_SERVER_KEY =
    "AAAATGPOTDE:APA91bEZLMpk9j4BMI4g4TCPidg_l3FW8TlNu5w0bPZddMERkUcP6HUXFhfpHzoKfZWMUQ-SjawLkkvooBUzh7xLBzyiWYbiytPct10-1b-43bWwRuYq-viqBIpB5oJ1o_ofUKXR2N7W";
serendip_1.HttpService.configure({
    httpPort: process.env.PORT || 4400,
    // leave empty for iis !!!
    cors: process.env["http.cors"] || "",
    staticPath: path_1.join(__dirname, "../", "storage", "public"),
    controllers: [AppointmentController_1.AppointmentController]
});
serendip_1.start({
    cpuCores: 1,
    services: [serendip_1.DbService, serendip_1.HttpService, DataService_1.DataService, ClientService_1.ClientService]
})
    .then(() => {
    console.info("Server Start at " + new Date());
})
    .catch(msg => console.error(msg));
