"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppointmentInterface_1 = require("../models/AppointmentInterface");
const GuestInterface_1 = require("../models/GuestInterface");
class AppointmentController {
    constructor(dataService) {
        this.dataService = dataService;
        this.create = {
            method: "POST",
            actions: [
                async (req, res, next, done) => {
                    var model = new AppointmentInterface_1.AppointmentInterface();
                    model.date = req.body.date;
                    model.deadLine = req.body.deadLine;
                    model.description = req.body.description;
                    model.maxGuest = req.body.maxGuest;
                    model.maxGuestTime = req.body.maxGuestTime;
                    model.ranges = req.body.ranges;
                    model.title = req.body.title;
                }
            ]
        };
        this.join = {
            method: "POST",
            actions: [
                async (req, res, next, done) => {
                    var model = new GuestInterface_1.GuestInterface();
                    model.date = req.body.date;
                    model.deadLine = req.body.deadLine;
                    model.description = req.body.description;
                    model.maxGuest = req.body.maxGuest;
                    model.maxGuestTime = req.body.maxGuestTime;
                    model.ranges = req.body.ranges;
                    model.title = req.body.title;
                }
            ]
        };
    }
}
exports.AppointmentController = AppointmentController;
