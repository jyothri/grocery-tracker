import { api } from './core/api';
import { createServer } from 'http';


const server = createServer((req, res) => api(req, res));
const port = 3000;
console.log(`Server listening on port ${port}`);
server.listen(port);