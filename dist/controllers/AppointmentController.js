"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppointmentController {
    constructor(dataService) {
        this.dataService = dataService;
        this.counts = {
            method: "POST",
            actions: [
                async (req, res, next, done) => {
                    res.json(0);
                }
            ]
        };
    }
}
exports.AppointmentController = AppointmentController;
