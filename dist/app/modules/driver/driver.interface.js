"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverAvailability = exports.ApprovalStatus = void 0;
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var DriverAvailability;
(function (DriverAvailability) {
    DriverAvailability["ONLINE"] = "ONLINE";
    DriverAvailability["OFFLINE"] = "OFFLINE";
    DriverAvailability["ON_TRIP"] = "ON_TRIP";
})(DriverAvailability || (exports.DriverAvailability = DriverAvailability = {}));
