import routeParser from 'route-parser';
import { IncomingMessage, ServerResponse } from 'http';
import * as url from 'url';
import * as user from './user';
import * as groceryItem from './grocery_item';

export default async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {

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

  // Define routes that can be handled
  const routes: Array<[string, string, (arg0: string) => Promise<void>]> = [

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
    ['GET', pathPrefix + '/users/:user_id', async (): Promise<void> => await user.get(req, res)],
    ['POST', pathPrefix + '/users', async (): Promise<void> => await user.create(req, res)],
    ['PATCH', pathPrefix + '/users/:user_id', async (): Promise<void> => await user.update(req, res)],
    ['DELETE', pathPrefix + '/users/:user_id', async (): Promise<void> => await user.remove(req, res)],
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
      await handler(urlParts.pathname);
      return;
    }
  }

  // No routes were matched, respond with 404
  res.statusCode = 404;
  res.end(JSON.stringify({ errors: { body: `[404 Not found: [${req.method} ${req.url} ]]`, }, }));
  return;

}