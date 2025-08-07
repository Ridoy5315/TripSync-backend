"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideProgressStatus = exports.RideRequestAction = void 0;
var RideRequestAction;
(function (RideRequestAction) {
    RideRequestAction["PENDING"] = "PENDING";
    RideRequestAction["CANCELED_BY_USER"] = "CANCELED";
    RideRequestAction["ACCEPTED_BY_DRIVER"] = "ACCEPTED";
    RideRequestAction["REJECTED_BY_DRIVER"] = "REJECTED";
})(RideRequestAction || (exports.RideRequestAction = RideRequestAction = {}));
var RideProgressStatus;
(function (RideProgressStatus) {
    RideProgressStatus["NOT_STARTED"] = "NOT_STARTED";
    RideProgressStatus["PICKED_UP"] = "PICKED_UP";
    RideProgressStatus["IN_TRANSIT"] = "IN_TRANSIT";
    RideProgressStatus["COMPLETED"] = "COMPLETED";
})(RideProgressStatus || (exports.RideProgressStatus = RideProgressStatus = {}));
