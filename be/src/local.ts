import { api } from './core/api';
import express from 'express';

const port = 3000;
console.log(`Server listening on port ${port}`);
const app = express();
app.all('/*', (req, res) => api(req, res));
app.listen(port);