import { IncomingMessage, ServerResponse } from 'http';

export async function create(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function get(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function update(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function remove(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}