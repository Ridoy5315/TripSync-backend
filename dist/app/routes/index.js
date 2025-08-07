"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_route_1 = require("../modules/user/user.route");
const auth_route_1 = require("../modules/auth/auth.route");
const driver_route_1 = require("../modules/driver/driver.route");
const rides_route_1 = require("../modules/rides/rides.route");
const stats_route_1 = require("../modules/stats/stats.route");
const payment_route_1 = require("../modules/payment/payment.route");
const otp_route_1 = require("../modules/otp/otp.route");
exports.router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: "/user",
        route: user_route_1.UserRoutes
    },
    {
        path: "/auth",
        route: auth_route_1.AuthRoutes
    },
    {
        path: "/driver",
        route: driver_route_1.DriverRoutes
    },
    {
        path: "/ride",
        route: rides_route_1.RidesRoutes
    },
    {
        path: "/stats",
        route: stats_route_1.StatsRoutes
    },
    {
        path: "/payment",
        route: payment_route_1.PaymentRoutes
    },
    {
        path: "/otp",
        route: otp_route_1.OtpRoutes
    },
];
moduleRoutes.forEach(route => {
    exports.router.use(route.path, route.route);
});
