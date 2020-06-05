import route from './router';
import { IncomingMessage, ServerResponse } from 'http';

// Top level entry point
export async function api(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  try {
    await route(req, res);
  } catch (e) {
    console.log(e);
    res.statusCode = 422;
    res.end(JSON.stringify({ errors: { body: [e.message], } }));
  }
}
