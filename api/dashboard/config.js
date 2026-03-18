import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');

export const config = {
  port: Number(process.env.DASHBOARD_API_PORT || 3100),
  host: process.env.DASHBOARD_API_HOST || '0.0.0.0',
  dataFile:
    process.env.DASHBOARD_DATA_FILE ||
    path.join(rootDir, 'server', 'dashboard', 'data', 'runs.json'),
  staticDirs: [
    {
      url: '/allure-results',
      dir:
        process.env.ALLURE_RESULTS_DIR ||
        path.join(rootDir, 'allure-results'),
    },
  ],
  cacheTimeout: Number(process.env.DASHBOARD_CACHE_TTL || 0),
  serviceName: process.env.DASHBOARD_SERVICE_NAME || 'HealthApp Test Dashboard API',
};
