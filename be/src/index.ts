import * as functions from 'firebase-functions';
import * as coreApi from './core/api';
import { IncomingMessage, ServerResponse } from 'http';

export const api = functions.https.onRequest(async (request: IncomingMessage, response: ServerResponse) => {
  await coreApi.api(request, response);
});