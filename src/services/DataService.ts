import {
  ServerServiceInterface,
  Server,
  DbService,
  AuthService
} from "serendip";
import { DbCollectionInterface, UserModel } from "serendip-business-model";

import * as _ from "underscore";
import * as fs from "fs";
import { join } from "path";
import * as json2xls from "json2xls";
import * as moment from "moment-jalaali";
import { resolve } from "url";

import * as request from "request";
import { ClientService } from "./ClientService";
import { PushTokenModel } from "../models/PushTokenModel";
import { AppointmentInterface } from "../models/AppointmentInterface";
import { GuestInterface } from "../models/GuestInterface";
import { SignedAppointmentInterface } from "../models/SignedAppointmentInterface";
import { SignedGuestInterface } from "../models/SignedGuestInterface";
export interface PushMessageInterface {
  title: string;
  text: string;
  users: string[];
  swal?: boolean;
  type?: string;
  url?: string;
  color?: string;
}

export class DataService implements ServerServiceInterface {
  static FCM_SERVER_KEY: string = "";
  public pushTokens: DbCollectionInterface<PushTokenModel>;

  public users: DbCollectionInterface<UserModel>;
  public appointments: DbCollectionInterface<SignedAppointmentInterface>;
  public guests: DbCollectionInterface<SignedGuestInterface>;

  constructor(
    private dbService: DbService,
    private clientService: ClientService
  ) {}
  async start() {
    this.dbService = Server.services["DbService"];

    this.pushTokens = await this.dbService.collection<PushTokenModel>(
      "PushTokens",
      false
    );

    this.users = await this.dbService.collection<UserModel>("Users", false);

    this.appointments = await this.dbService.collection("Appointments", false);

    this.guests = await this.dbService.collection<SignedGuestInterface>(
      "Guests",
      false
    );

    this.users = await this.dbService.collection<UserModel>("Users", false);

    if (this.clientService.data)
      for (const collectionName in this.dbService.events()) {
        if (collectionName != "EntityChanges")
          if (collectionName[0] === collectionName[0].toUpperCase()) {
            const collection = await this.dbService.collection(
              collectionName,
              false
            );

            var neverPushedToSerendip: any[] = await collection.find({
              _business: { $ne: process.env["serendip.business"] }
            });

            for (const item of neverPushedToSerendip) {
              console.log("pushing " + item._id);
              await collection.updateOne(
                await this.clientService.data.update(collectionName, item)
              );
            }

            const eventStream = this.dbService.events()[collectionName];

            eventStream.on("insert", doc => {
              this.clientService.data
                .insert(collectionName, doc)
                .then(() => console.log(`${doc._id} insert synced`))
                .catch(e => console.log(`${doc._id} insert sync error`, e));
            });

            eventStream.on("update", doc => {
              this.clientService.data
                .update(collectionName, doc)
                .then(() => console.log(`${doc._id} update synced`))
                .catch(e => console.log(`${doc._id} update sync error`, e));
            });

            eventStream.on("delete", doc => {
              this.clientService.data
                .delete(collectionName, doc._id)
                .then(() => console.log(`${doc._id} delete synced`))
                .catch(e => console.log(`${doc._id} delete sync error`, e));
            });
          }
      }
  }

  sendPushToToken(tokenModel: PushTokenModel, model: PushMessageInterface) {
    return new Promise((resolve, reject) => {
      var pushModel: any = {
        to: tokenModel.token,
        data: {
          toast: {
            type: model.type || "success",
            title: model.title,
            position: "top-end"
          }
        },
        notification: {
          title: model.title,
          icon: "",
          body: model.text,
          collapse_key: "هلپیا",
          sound: "default",
          color: model.color,
          click_action: model.url || "https://pwa.helpia.ir"
        }
      };

      if (model.swal)
        pushModel.data.swal = {
          title: model.title,
          text: model.text,
          type: model.type
        };

      if (tokenModel.platform) {
        if (tokenModel.platform == "android")
          pushModel.notification.icon = "fcm_push_icon";
        else pushModel.notification.icon = "/assets/logo.png";
      } else pushModel.notification.icon = "fcm_push_icon";

      console.log(pushModel, tokenModel);

      request(
        "https://fcm.googleapis.com/fcm/send",
        {
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            Authorization: "key=" + DataService.FCM_SERVER_KEY
          },
          json: pushModel,
          method: "POST"
        },
        (err, res, body) => {
          if (err) return reject(err);

          if (body && body.results)
            if (body.results.length == 1)
              if (body.results[0].error)
                this.pushTokens.deleteOne(tokenModel._id);

          resolve(body);
        }
      );
    });
  }

  async sendPush(model: PushMessageInterface) {
    return Promise.all(
      _.map(model.users, userId => {
        return new Promise(async (resolve, reject) => {
          var pushTokens = await this.pushTokens.find({
            user: userId.toString()
          });

          var sendPromises = _.map(pushTokens, tokenRecord => {
            return this.sendPushToToken(tokenRecord, model);
          });

          try {
            await Promise.all(sendPromises);
          } catch (error) {}

          resolve();
        });
      })
    );
  }
}
