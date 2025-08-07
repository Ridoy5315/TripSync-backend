"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationError = void 0;
const handleValidationError = (err) => {
    const errorSources = [];
    const errors = Object.values(err.errors);
    errors.forEach((errorObject) => {
        errorSources.push({
            path: errorObject.path,
            message: errorObject.message,
        });
    });
    return {
        statusCode: 400,
        message: err.message,
        errorSources,
    };
};
exports.handleValidationError = handleValidationError;
