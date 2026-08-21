"use strict";
/**
 * Banolia Server Entry Point
 */
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const PORT = env_1.ENV.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
    app_1.app.listen(PORT, () => {
        console.log(`[BANOLIA Server] Listening on port ${PORT} (Agency: ${env_1.ENV.DEFAULT_AGENCY_NAME})`);
        console.log(`[BANOLIA Server] Core Banking & BCEAO Prudential Analyzer Ready`);
    });
}
exports.default = app_1.app;
