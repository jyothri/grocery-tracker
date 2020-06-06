import { Request, Response } from 'express';

class User {
  name?: string; // Unset during createUser request. Set otherwise.
  email?: string; // Optional
  password?: string; // Mandatory only for login
  image?: string; // Optional
  token?: string; // Unset during createUser request. Set otherwise.
}

export async function create(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  const user: User = new User();
  user.email = 'abc@example.com';
  user.name = 'users/user1';
  user.image = 'http://image.jpg';
  user.token = 'abcsdfsdfsdf32fsd342';
  res.end(JSON.stringify(user));
}

export async function custom(req: Request, res: Response, arg: { [x: string]: string }): Promise<void> {
  if (!arg || !arg['custom_method']) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  const parts = arg['custom_method'].split(':');
  switch (parts[1]) {
    case 'login':
      console.log("Login to be performed for ", parts[0]);
      res.statusCode = 200;
      res.end(JSON.stringify({ message: "Login: To be implemented." }));
      return;
    default:
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Not found. Invalid custom method." }));
      return;
  }
}

export async function get(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Get: To be implemented." }));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Update: To be implemented." }));
}

export async function remove(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Delete: To be implemented." }));
}