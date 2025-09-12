/* eslint-disable @typescript-eslint/no-explicit-any */
import { Query } from "mongoose";
import { excludeField } from "../constant";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };

    for (const field of excludeField) {
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
      } else if (filter.isActiveValue === "UNBLOCK") {
        filter.isActive = { $in: ["ACTIVE", "INACTIVE"] } as any;
      }
      delete filter.isActiveValue;
    }

    if (filter.startDate && filter.endDate) {
      (filter as any).rideRequestAt = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate),
      };
      delete filter.startDate;
      delete filter.endDate;
    }

    if (filter.fareRange) {
      const [minFare, maxFare] = filter.fareRange.split(" - ").map(Number);
      (filter as any).originalFare = {
        $gte: minFare,
        $lte: maxFare || Infinity,
      };
      delete filter.fareRange;
    }

    this.modelQuery = this.modelQuery.find(filter);

    return this;
  }

  search(userSearchableFields: string[]): this {

    const searchTerm = this.query.searchTerm || ""

    const searchQuery = {
      $or : userSearchableFields.map(field => ({[field]: {$regex: searchTerm, $options: "i"}}))
    }

    this.modelQuery = this.modelQuery.find(searchQuery)

    return this
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }

  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    //     const totalDocuments = await this.modelQuery.model.countDocuments();
    // clone the query before skip/limit applied
    const queryWithoutPagination = this.modelQuery.model.find(
      this.modelQuery.getQuery()
    );

    const totalDocuments = await queryWithoutPagination.countDocuments();
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return { total: totalDocuments, page, limit, totalPage };
  }
}
