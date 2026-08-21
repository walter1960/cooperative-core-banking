/**
 * Banolia Server Entry Point
 */

import { app } from './app';
import { ENV } from './config/env';

const PORT = ENV.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[BANOLIA Server] Listening on port ${PORT} (Agency: ${ENV.DEFAULT_AGENCY_NAME})`);
    console.log(`[BANOLIA Server] Core Banking & BCEAO Prudential Analyzer Ready`);
  });
}

export default app;
