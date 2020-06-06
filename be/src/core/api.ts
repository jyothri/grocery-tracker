import route from './router';
import { Request, Response } from 'express';

// Top level entry point
export async function api(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  try {
    await route(req, res);
  } catch (e) {
    console.log(e);
    res.statusCode = 500;
    res.end(JSON.stringify({ errors: { body: [e.message], } }));
  }
}
