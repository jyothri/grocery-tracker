import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../cloud/firestore';
import { CreateGroceryItemRequest, GroceryItem } from './groceryitemtypes';

const apiName = 'api.jkurapati.com';
const collectionName = 'groceries';

// Top level entry point
export async function todo(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function create(createGroceryItemRequest: CreateGroceryItemRequest): Promise<GroceryItem> {
  const toCreate = createGroceryItemRequest.groceryItem;
  toCreate.name = createGroceryItemRequest.parent + '/' + 'groceryitems' + '/' + crypto.randomBytes(8).toString('hex');
  toCreate.createTime = new Date().toDateString();
  toCreate.updateTime = new Date().toDateString();
  const docPath = apiName + '/' + toCreate.name;

  console.log('Creating document ', toCreate.name);
  const userRef = db.collection(collectionName).doc(docPath);
  await userRef.set(toCreate);
  return toCreate;
}

export async function list(userName: string): Promise<Set<GroceryItem>> {
  const queryResult = await db.collection(collectionName + '/' + apiName + '/users/' + userName + '/groceryitems').get();
  if (queryResult.empty) {
    throw Error(`Did not find any grocery items for ${userName}`);
  }
  const set: Set<GroceryItem> = new Set();
  queryResult.forEach(doc => {
    const groceryItem = doc.data() as GroceryItem;
    set.add(groceryItem);
  });
  return set;
}

export async function get(userName: string, groceryItemName: string): Promise<GroceryItem> {
  const name = apiName + '/users/' + userName + '/groceryitems/' + groceryItemName;
  const docRef = db.collection(collectionName).doc(name);
  const findResult = await docRef.get();
  const groceryItem = findResult.data() as GroceryItem;
  if (!groceryItem) {
    throw Error(`groceryItem not found: [${name}]`);
  }
  return groceryItem;
}

export async function update(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "To be implemented." }));
}

export async function remove(userName: string, groceryItemName: string): Promise<void> {
  const name = apiName + '/users/' + userName + '/groceryitems/' + groceryItemName;
  const docRef = db.collection(collectionName).doc(name);
  const findResult = await docRef.get();
  const groceryItem = findResult.data() as GroceryItem;
  if (!groceryItem) {
    throw Error(`groceryItem not found: [${name}]`);
  }
  await docRef.delete();
}