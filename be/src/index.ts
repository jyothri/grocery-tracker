import * as functions from 'firebase-functions';
import * as coreApi from './core/api';
import { Request, Response } from 'express';

export const api = functions.https.onRequest(async (request: Request, response: Response) => {
  await coreApi.api(request, response);
});