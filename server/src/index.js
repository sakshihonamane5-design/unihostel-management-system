import { loadEnv, getEnv, requireMongoUri } from './config/env.js';
import { connectDb } from './db/connect.js';
import { createApp } from './app.js';

loadEnv();

const env = getEnv();
const app = createApp(env);

const uri = requireMongoUri(env);
await connectDb(uri);

app.listen(env.PORT, () => {
  console.log(`UniHostel API listening on port ${env.PORT}`);
});
