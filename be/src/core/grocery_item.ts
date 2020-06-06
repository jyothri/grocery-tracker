import { Request, Response } from 'express';

// Top level entry point
export async function todo(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function list(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function get(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function remove(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}