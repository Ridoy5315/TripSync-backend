import { Types } from "mongoose";



export interface ISSLCommerz {
     rideId: Types.ObjectId,
     amount : number;
     transactionId: string;
     name: string;
     email: string;
     phoneNumber: string;
     address: string
}