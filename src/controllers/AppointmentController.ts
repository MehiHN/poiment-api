import { join } from "path";
import {
  AuthService,
  HttpEndpointInterface,
  HttpError,
  Server
} from "serendip";
import * as sUtil from "serendip-utility";
import * as _ from "underscore";
import { DataService } from "../services/DataService";
import { AppointmentInterface } from "../models/AppointmentInterface";
import { GuestInterface } from "../models/GuestInterface";
import * as jwt from "jsonwebtoken";
import { SignedAppointmentInterface } from "../models/SignedAppointmentInterface";
import * as bcrypt from "bcryptjs";
import { SignedGuestInterface } from "../models/SignedGuestInterface";

export class AppointmentController {
  constructor(private dataService: DataService) {}

  public create: HttpEndpointInterface = {
    method: "POST",
    actions: [
      async (req, res) => {
        const model: AppointmentInterface = {
          date: req.body.date,
          deadLine: req.body.deadLine,
          description: req.body.description,
          maxGuest: req.body.maxGuest,
          maxGuestTime: req.body.maxGuestTime,
          ranges: req.body.ranges,
          title: req.body.title
        };

        const secret = sUtil.text.randomAsciiString(8).toLowerCase();
        const signedModel = jwt.sign(model, secret);

        const manageSecret = sUtil.text.randomAsciiString(32).toLowerCase();
        const manageSecretSalt = sUtil.text.randomAsciiString(6).toLowerCase();

        const signedAppointment: SignedAppointmentInterface = {
          ip: req.ip(),
          useragent: req.useragent(),
          uid: sUtil.text.randomAsciiString(16).toLowerCase(),
          signedModel,
          manageSecret: bcrypt.hashSync(manageSecret + manageSecretSalt, 6),
          manageSecretSalt: manageSecretSalt
        };

        await this.dataService.appointments.insertOne(signedAppointment);

        res.json({
          uid: signedAppointment.uid,
          secret,
          manageSecret
        });
      }
    ]
  };

  public edit: HttpEndpointInterface = {
    method: "POST",
    route: "/api/guests/:uid/:secret/:manageSecret",
    actions: [
      async (req, res, next, done) => {
        const appointmentQuery = await this.dataService.appointments.find({
          uid: req.params.uid
        });

        if (appointmentQuery[0]) {
          if (
            !bcrypt.compareSync(
              appointmentQuery[0].manageSecret +
                appointmentQuery[0].manageSecretSalt,
              req.params.manageSecret
            )
          ) {
            next(new HttpError(400, "manage secret is wrong"));
          }
         
           




          
        } else {
          next(new HttpError(400, "appointment not found"));
        }
      }
    ]
  };

  public get: HttpEndpointInterface = {
    method: "POST",
    route: "/api/get/:uid/:secret",
    actions: [
      async (req, res, next, done) => {
        const query = await this.dataService.appointments.find({
          uid: req.params.uid
        });

        if (query[0]) {
          const signedAppointment: SignedAppointmentInterface = query[0];
          jwt.verify(
            signedAppointment.signedModel,
            req.params.secret,
            {},
            (err, decode) => {}
          );
        }
      }
    ]
  };

  public guests: HttpEndpointInterface = {
    method: "POST",
    route: "/api/guests/:uid/:secret/:manageSecret",
    actions: [
      async (req, res, next, done) => {
        const appointmentQuery = await this.dataService.appointments.find({
          uid: req.params.uid
        });

        if (appointmentQuery[0]) {
          if (
            !bcrypt.compareSync(
              appointmentQuery[0].manageSecret +
                appointmentQuery[0].manageSecretSalt,
              req.params.manageSecret
            )
          ) {
            next(new HttpError(400, "manage secret is wrong"));
          }
          const guestsQuery = await this.dataService.guests.find({
            appointmentId: appointmentQuery[0]._id
          });

          const guests: GuestInterface[] = await Promise.all(
            guestsQuery.map(signedGuest => {
              return new Promise((resolve, reject) => {
                jwt.verify(
                  signedGuest.signedModel,
                  req.params.secret,
                  {},
                  (err, decoded) => {
                    if (err) return reject(err);
                    resolve(decoded as any);
                  }
                );
              });
            })
          );

          res.json(guests);
        } else {
          next(new HttpError(400, "appointment not found"));
        }
      }
    ]
  };

  public join: HttpEndpointInterface = {
    method: "POST",
    route: "/api/join/:uid/:secret",
    actions: [
      async (req, res, next, done) => {
        var guest = new GuestInterface();
        guest.name = req.body.name;
        guest.mobile = req.body.mobile;
        guest.ranges = req.body.ranges;

        const appointmentQuery = await this.dataService.appointments.find({
          uid: req.params.uid
        });

        if (appointmentQuery[0]) {
          await this.dataService.guests.insertOne({
            signedModel: jwt.sign(guest, req.params.secret)
          });
        }
      }
    ]
  };
}
