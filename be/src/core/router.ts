import routeParser from 'route-parser';
import { Request, Response } from 'express';
import { CreateUserRequest, User } from './usertypes';

import * as url from 'url';
import * as user from './user';
import * as groceryItem from './grocery_item';

export default async function route(req: Request, res: Response): Promise<void> {

  const version = 1;
  const pathPrefix = '/' + 'v' + version;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const requestHeaders = req.headers["access-control-allow-headers"];
  if (typeof requestHeaders === "string") {
    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
  }

  if (req.method == 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  let validatedUser = null; // eslint-disable-line no-var
  const rawToken = req.get('Authorization');
  if (rawToken) {
    const matchedToken = rawToken.match(/Token (.*)/);
    if (matchedToken && matchedToken[1]) {
      console.log(`matchedToken = ${matchedToken}`);
      validatedUser = await user.authenticateToken(matchedToken[1]);
    }
  }

  // Define routes that can be handled
  const routes: Array<[string, string, (arg0: { [x: string]: string }) => Promise<void>]> = [

    // Helpers
    ['GET', pathPrefix + '/ping', async (): Promise<void> => {
      res.statusCode = 200;
      res.end(JSON.stringify({
        pong: new Date(),
      }));
    }],

    // GroceryItems
    ['GET', pathPrefix + '/users/:user_id/grocery_items/:grocery_item_id', async (): Promise<void> => await groceryItem.todo(req, res)],
    ['GET', pathPrefix + '/users/:user_id/grocery_items', async (): Promise<void> => await groceryItem.todo(req, res)],
    ['POST', pathPrefix + '/users/:user_id/grocery_items/:grocery_item_id', async (): Promise<void> => await groceryItem.todo(req, res)],
    ['PATCH', pathPrefix + '/users/:user_id/grocery_items/:grocery_item_id', async (): Promise<void> => await groceryItem.todo(req, res)],
    ['DELETE', pathPrefix + '/users/:user_id/grocery_items/:grocery_item_id', async (): Promise<void> => await groceryItem.todo(req, res)],

    // Users
    ['GET', pathPrefix + '/users/:user_id', async (arg0): Promise<void> => await user.get(arg0, res)],
    ['POST', pathPrefix + '/users/:custom_method', async (arg0): Promise<void> => await user.custom(req.body as User, res, arg0)],
    ['POST', pathPrefix + '/users', async (): Promise<void> => await user.create(req.body as CreateUserRequest, res)],
    ['PATCH', pathPrefix + '/users/:user_id', async (): Promise<void> => await user.update(req, res)],
    ['DELETE', pathPrefix + '/users/:user_id', async (arg0): Promise<void> => await user.remove(arg0, res)],
  ];

  if (req.url == undefined) {
    throw new Error('req.url is undefined. Please verify we are running in http environment.');
  }
  const urlParts = url.parse(req.url);

  if (urlParts.pathname == undefined) {
    throw new Error('urlParts.pathname is undefined. Please verify we are running in http environment.');
  }

  // Match route and call handler
  for (let i = 0; i < routes.length; ++i) {
    const method = routes[i][0];
    const route = routes[i][1];
    const handler = routes[i][2];
    if (req.method !== method) {
      continue;
    }

    const matchedPath = (new routeParser(route)).match(urlParts.pathname);
    if (matchedPath) {
      console.log(`Route for ${method} ${urlParts.pathname}`);
      if (matchedPath['user_id'] && (!validatedUser || 'users/' + matchedPath['user_id'] !== validatedUser.name)) {
        res.status(401).send({ errors: { body: ['Token is required'], }, });
        return;
      }
      await handler(matchedPath);
      return;
    }
  }

  // No routes were matched, respond with 404
  res.statusCode = 404;
  res.end(JSON.stringify({ errors: { body: `[404 Not found: [${req.method} ${req.url} ]]`, }, }));
  return;

}