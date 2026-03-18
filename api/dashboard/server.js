import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { config } from './config.js';
import { DataStore, resolveDataFile } from './dataStore.js';
import { runsRouter } from './routes/runs.js';
import { metricsRouter } from './routes/metrics.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

const dataFile = resolveDataFile(config.dataFile);
const store = new DataStore(dataFile);

config.staticDirs.forEach((entry) => {
  app.use(entry.url, express.static(entry.dir));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: config.serviceName });
});

app.use('/runs', runsRouter(store));
app.use('/metrics', metricsRouter(store));

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, config.host, () => {
  console.log(`${config.serviceName} listening on ${config.host}:${config.port}`);
});
