export interface IPlan {
  _id: string;
  planId: string;
  name: string;
  features: Array<string>;
  createdAt: string;
  updatedAt: string;
  price: string;
  numberOfCalendarsAllowed?: 1;
}
