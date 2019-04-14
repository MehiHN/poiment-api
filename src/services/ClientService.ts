import { HttpServiceInterface, DbService, Server } from "serendip";
import * as SBC from "serendip-business-client";
import * as WS from "ws";
import * as _ from "underscore";
import { EntityModel } from "serendip-business-model";
import { MongodbProvider } from "serendip-mongodb-provider";
import * as fs from "fs-extra";
import { join } from "path";
export class ClientService implements HttpServiceInterface {
  business: SBC.BusinessService;
  data: SBC.DataService;
  ws: SBC.WsService;
  entitySocket: WebSocket;
  db: SBC.DbService;
  constructor() {}

  async start() {
    if (!process.env["serendip.business"]) {
      console.log(
        `Serendip client service won't start because "serendip.business" env is not provided!`
      );
      return;
    }

    SBC.DbService.configure({
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

    SBC.WsService.configure({
      webSocketClass: WS
    });

    SBC.AuthService.configure({
      username: process.env["serendip.username"],
      password: process.env["serendip.password"]
    });

    if (process.env["serendip.server"])
      SBC.DataService.server = process.env["serendip.server"];

    SBC.DataService.configure({
      business: process.env["serendip.business"]
    });
    const localStoragePath = join(Server.dir, "..", ".localStorage.json");

    SBC.LocalStorageService.configure({
      clear: async () => {
        try {
          await fs.unlink(localStoragePath);
        } catch {}
        await fs.writeJSON(localStoragePath, {});
      },
      load: async () => {
        if (!(await fs.pathExists(localStoragePath)))
          await fs.writeJSON(localStoragePath, {});
        return fs.readJSON(localStoragePath);
      },
      get: async key => (await fs.readJSON(localStoragePath))[key],
      set: async (key, value) => {
        const storage = await fs.readJSON(localStoragePath);
        storage[key] = value;
        try {
          await fs.unlink(localStoragePath);
        } catch {}
        await fs.writeJSON(localStoragePath, storage);
      },
      remove: async key => {
        const storage = await fs.readJSON(localStoragePath);
        delete storage[key];
        try {
          await fs.unlink(localStoragePath);
        } catch {}
        await fs.writeJSON(localStoragePath, storage);
      },
      save: async storage => {
        try {
          await fs.unlink(localStoragePath);
        } catch {}
        await fs.writeJSON(localStoragePath, storage);
      }
    });

    await SBC.Client.bootstrap({
      services: [
        SBC.DbService,
        SBC.DataService,
        SBC.BusinessService,
        SBC.AuthService,
        SBC.HttpClientService,
        SBC.LocalStorageService,
        SBC.WsService
      ],
      logging: "info"
    });

    console.log("\n\tSerendip client service started!\n");

    this.data = SBC.Client.services["DataService"];
    this.business = SBC.Client.services["BusinessService"];
    this.ws = SBC.Client.services["WsService"];
    this.db = SBC.Client.services["DbService"];

    console.log("sync start at " + new Date());

    this.data
      .sync()
      .then(() => {
        console.log("sync done at " + new Date());
      })
      .catch(e => {
        console.error("sync error at " + new Date(), e);
      });
  }

  async initEntitySocket() {
    this.entitySocket = await this.ws.newSocket("/entity", true);
    this.entitySocket.onclose = () => {
      this.initEntitySocket();
    };
    this.entitySocket.onmessage = async msg => {
      let data: {
        event: "update" | "delete" | "insert";
        model: EntityModel;
      };

      try {
        data = JSON.parse(msg.data);
      } catch (error) {}

      if (data && data.model) {
        const collection = await this.db.collection(data.model._entity, true);

        if (data.event == "delete") {
          await collection.deleteOne(data.model._id);
        }
        if (data.event == "update") {
          await collection.updateOne(data.model);
        }

        if (data.event == "insert") {
          await collection.insertOne(data.model);
        }
      }

      // if (data.model) {
      //   data.model = this.data.decrypt(data.model);
      // }
    };
  }
}
