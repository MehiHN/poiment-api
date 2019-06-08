export interface AppointmentInterface {
  title: string;
  description: string;
  maxGuest: number;
  maxGuestTime: number;
  date: Date;
  deadLine: Date;
  ranges: number[][];
}
