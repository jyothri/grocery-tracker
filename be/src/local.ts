import { api } from './core/api';
import express from 'express';
import bodyParser from 'body-parser';

const port = 3000;
console.log(`Server listening on port ${port}`);
const app = express();
app.use(bodyParser.json());
app.all('/*', (req, res) => api(req, res));
app.listen(port);