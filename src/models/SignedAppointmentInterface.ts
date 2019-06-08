import { EntityModel } from "serendip-business-model";

export interface SignedAppointmentInterface extends EntityModel {
  uid: string;
  signedModel: string;

  manageSecret: string;

  manageSecretSalt: string;

  ip: string;
  useragent: string;
}
