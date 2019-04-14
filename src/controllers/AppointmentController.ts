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

export class AppointmentController {
  constructor(
    private dataService: DataService
  ) {
    
  }

  public counts: HttpEndpointInterface = {
    method: "POST",
    actions: [
      async (req, res, next, done) => {
        res.json(0);
      }
    ]
  };
 
}
