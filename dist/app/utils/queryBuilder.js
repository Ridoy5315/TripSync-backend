"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
const constant_1 = require("../constant");
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    filter() {
        const filter = Object.assign({}, this.query);
        for (const field of constant_1.excludeField) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete filter[field];
        }
        if (filter.status) {
            filter.rideRequestAction = filter.status; // DB field name
            delete filter.status; // remove from query so it doesn't interfere
        }
        if (filter.adminGender) {
            filter.gender = filter.adminGender; // DB field name
            delete filter.adminGender; // remove from query so it doesn't interfere
        }
        // if (filter.riderGender) {
        //   filter.rider.gender = filter.riderGender; // DB field name
        //   delete filter.riderGender; // remove from query so it doesn't interfere
        // }
        if (filter.driverApprovalStatus) {
            filter.approvalStatus = filter.driverApprovalStatus;
            delete filter.driverApprovalStatus;
        }
        if (filter.isActiveValue) {
            if (filter.isActiveValue === "BLOCK") {
                filter.isActive = "BLOCK";
            }
            else if (filter.isActiveValue === "UNBLOCK") {
                filter.isActive = { $in: ["ACTIVE", "INACTIVE"] };
            }
            delete filter.isActiveValue;
        }
        if (filter.startDate && filter.endDate) {
            filter.rideRequestAt = {
                $gte: new Date(filter.startDate),
                $lte: new Date(filter.endDate),
            };
            delete filter.startDate;
            delete filter.endDate;
        }
        if (filter.fareRange) {
            const [minFare, maxFare] = filter.fareRange.split(" - ").map(Number);
            filter.originalFare = {
                $gte: minFare,
                $lte: maxFare || Infinity,
            };
            delete filter.fareRange;
        }
        this.modelQuery = this.modelQuery.find(filter);
        return this;
    }
    search(userSearchableFields) {
        const searchTerm = this.query.searchTerm || "";
        const searchQuery = {
            $or: userSearchableFields.map(field => ({ [field]: { $regex: searchTerm, $options: "i" } }))
        };
        this.modelQuery = this.modelQuery.find(searchQuery);
        return this;
    }
    sort() {
        const sort = this.query.sort || "-createdAt";
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    fields() {
        var _a;
        const fields = ((_a = this.query.fields) === null || _a === void 0 ? void 0 : _a.split(",").join(" ")) || "";
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    paginate() {
        const page = Number(this.query.page) || 1;
        const limit = Number(this.query.limit) || 10;
        const skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    build() {
        return this.modelQuery;
    }
    getMeta() {
        return __awaiter(this, void 0, void 0, function* () {
            //     const totalDocuments = await this.modelQuery.model.countDocuments();
            // clone the query before skip/limit applied
            const queryWithoutPagination = this.modelQuery.model.find(this.modelQuery.getQuery());
            const totalDocuments = yield queryWithoutPagination.countDocuments();
            const page = Number(this.query.page) || 1;
            const limit = Number(this.query.limit) || 10;
            const totalPage = Math.ceil(totalDocuments / limit);
            return { total: totalDocuments, page, limit, totalPage };
        });
    }
}
exports.QueryBuilder = QueryBuilder;
