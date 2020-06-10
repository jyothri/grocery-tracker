import routeParser from 'route-parser';
import { Request, Response } from 'express';
import { CreateUserRequest, UpdateUserRequest, User } from './usertypes';
import { CreateGroceryItemRequest, UpdateGroceryItemRequest } from './groceryitemtypes';
import * as tokenHelper from './token_helper';

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
      try {
        const username = tokenHelper.getUserNameFromToken(matchedToken[1]);
        validatedUser = await user.get(username);
      } catch (err) {
        res.status(401).send({ errors: { body: [err.message], }, });
        return;
      }
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
    ['GET', pathPrefix + '/users/:user_id/groceryitems/:grocery_item_id', async (arg): Promise<void> => {
      if (!arg || !arg['user_id'] || !arg['grocery_item_id']) {
        res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
        return;
      }
      try {
        const retrievedGroceryItem = await groceryItem.get(arg['user_id'], arg['grocery_item_id']);
        res.status(200).end(JSON.stringify(retrievedGroceryItem));
      } catch (e) {
        res.status(404).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['GET', pathPrefix + '/users/:user_id/groceryitems', async (arg): Promise<void> => {
      if (!arg || !arg['user_id']) {
        res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
        return;
      }
      try {
        const retrievedGroceryItems = await groceryItem.list(arg['user_id']);
        res.status(200).end(JSON.stringify(Array.from(retrievedGroceryItems.values())));
      } catch (e) {
        res.status(404).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['POST', pathPrefix + '/users/:user_id/groceryitems', async (): Promise<void> => {
      const createdGroceryItem = await groceryItem.create(req.body as CreateGroceryItemRequest);
      res.status(200).end(JSON.stringify(createdGroceryItem));
    }],
    ['PATCH', pathPrefix + '/users/:user_id/groceryitems/:grocery_item_id', async (arg): Promise<void> => {
      try {
        if (!arg || !arg['user_id'] || !arg['grocery_item_id']) {
          res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
          return;
        }
        const updatedGroceryItem = await groceryItem.update(arg['user_id'], arg['grocery_item_id'], req.body as UpdateGroceryItemRequest);
        res.status(200).end(JSON.stringify(updatedGroceryItem));
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['DELETE', pathPrefix + '/users/:user_id/groceryitems/:grocery_item_id', async (arg): Promise<void> => {
      try {
        if (!arg || !arg['user_id'] || !arg['grocery_item_id']) {
          res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
          return;
        }
        await groceryItem.remove(arg['user_id'], arg['grocery_item_id']);
        res.status(200).end();
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],

    // Users
    ['GET', pathPrefix + '/users/:user_id', async (arg): Promise<void> => {
      if (!arg || !arg['user_id']) {
        res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
        return;
      }
      try {
        const retrievedUser = await user.get('users' + '/' + arg['user_id']);
        res.status(200).end(JSON.stringify(retrievedUser));
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['POST', pathPrefix + '/users/:custom_method', async (arg): Promise<void> => {
      try {
        if (!arg || !arg['custom_method']) {
          res.status(404).end(JSON.stringify({ errors: { body: ["Not found"], } }));
          return;
        }
        const updatedUser = await user.custom(req.body as User, arg['custom_method']);
        res.status(200).end(JSON.stringify(updatedUser));
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['POST', pathPrefix + '/users', async (): Promise<void> => {
      try {
        const createdUser = await user.create(req.body as CreateUserRequest);
        res.status(200).end(JSON.stringify(createdUser));
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['PATCH', pathPrefix + '/users/:user_id', async (arg0): Promise<void> => {
      try {
        const updatedUser = await user.update(req.body as UpdateUserRequest, arg0);
        res.status(200).end(JSON.stringify(updatedUser));
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }
    }],
    ['DELETE', pathPrefix + '/users/:user_id', async (arg0): Promise<void> => {
      try {
        await user.remove(arg0);
        res.status(200).end();
      } catch (e) {
        res.status(400).end(JSON.stringify({ errors: { body: [e.message], } }));
      }

    }],
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
      if (matchedPath['user_id']) {
        if (!validatedUser) {
          res.status(401).send({ errors: { body: ['Unauthorized: Token is required'], }, });
          return;
        }
        const userName = 'users/' + matchedPath['user_id'];
        if (userName !== validatedUser.name) {
          res.status(403).send({ errors: { body: ['Forbidden: Token invalid'], }, });
          return;
        }
      }
      await handler(matchedPath);
      return;
    }
  }

  // No routes were matched, respond with 404
  res.status(404).end(JSON.stringify({ errors: { body: `[404 Not found: [${req.method} ${req.url} ]]`, }, }));
}