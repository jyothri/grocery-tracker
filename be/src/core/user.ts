import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { db } from '../cloud/firestore';
import crypto from 'crypto';
import { CreateUserRequest, User } from './usertypes';


const tokenSecret = process.env.SECRET ? process.env.SECRET : '3ee058420bc2';
const apiName = 'api.jkurapati.com';

function mintToken(aUsername: string): string {
  return jwt.sign({
    username: aUsername
  }, tokenSecret, {
    expiresIn: '2 days'
  });
}

function validateCreateUserRequest(createUser: User): void {
  if (createUser.name !== undefined) {
    throw `user specified resource id [${createUser.name}] not supported.`;
  }
  if (createUser.token !== undefined) {
    throw `token [${createUser.token}] should not be provided in create request.`;
  }
}

function getUserByEmail(email: string): Promise<User> {
  return new Promise(async (resolve, reject) => {
    const queryResult = await db.collection('users/' + apiName + '/users').where('email', '==', email).get();
    if (queryResult.empty || queryResult.size > 1) {
      resolve(undefined);
    }

    queryResult.forEach(doc => {
      const user = doc.data() as User;
      resolve(user);
    });
    reject(`this should never happen. ErrorCode 502`);
  });
}

export async function create(body: any, res: Response): Promise<void> {
  const createUserRequest = JSON.parse(body) as CreateUserRequest;
  const userToCreate = createUserRequest.user;
  try {
    validateCreateUserRequest(userToCreate);
  } catch (err) {
    res.statusCode = 400;
    res.end(JSON.stringify({ errors: { 'message': err, } }));
    return;
  }

  userToCreate.name = 'users' + '/' + crypto.randomBytes(8).toString('hex');
  userToCreate.encryptedPassword = await bcrypt.hash(userToCreate.password, 5);
  userToCreate.password = '';
  const docPath = apiName + '/' + userToCreate.name;

  console.log('Creating document ', userToCreate.name);
  const userRef = db.collection('users').doc(docPath);
  await userRef.set(userToCreate);

  userToCreate.token = mintToken(userToCreate.name);
  userToCreate.password = undefined;
  userToCreate.encryptedPassword = undefined;
  res.statusCode = 200;
  res.end(JSON.stringify(userToCreate));
}

export async function get(arg: { [x: string]: string }, res: Response): Promise<void> {
  if (!arg || !arg['user_id']) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Not found" }));
    return;
  }
  const name = apiName + '/users' + '/' + arg['user_id'];
  const docRef = db.collection('users').doc(name);
  const findResult = await docRef.get();
  const user = findResult.data();
  if (!user) {
    res.statusCode = 400;
    res.end(JSON.stringify({ errors: { 'message': `User not found: [${name}]`, } }));
    return;
  }

  user.token = mintToken(name);
  res.statusCode = 200;
  res.end(JSON.stringify(user));
}

export async function custom(body: any, res: Response, arg: { [x: string]: string }): Promise<void> {
  if (!arg || !arg['custom_method']) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  const customMethod = arg['custom_method'];
  switch (customMethod) {
    case 'login':
      const loginUser = JSON.parse(body) as User;
      if (!loginUser.email) {
        res.statusCode = 400;
        res.end(JSON.stringify({ errors: { 'message': `email is mandatory`, } }));
        return;
      }

      const foundUser = await getUserByEmail(loginUser.email);
      if (!foundUser || !foundUser.encryptedPassword) {
        res.statusCode = 400;
        res.end(JSON.stringify({ errors: { 'message': `invalid email ${loginUser.email}`, } }));
        return;
      }

      if (!foundUser.name) {
        res.statusCode = 400;
        res.end(JSON.stringify({ errors: { 'message': 'name in document should always exist', } }));
        return;
      }

      const passwordCheckResult = await bcrypt.compare(loginUser.password, foundUser.encryptedPassword);
      if (!passwordCheckResult) {
        res.statusCode = 404;
        res.end(JSON.stringify({ message: "Incorrect password" }));
        return;
      }

      foundUser.token = mintToken(foundUser.name);
      foundUser.password = undefined;
      foundUser.encryptedPassword = undefined;

      res.statusCode = 200;
      res.end(JSON.stringify(foundUser));
      return;
    default:
      res.statusCode = 404;
      res.end(JSON.stringify({ message: "Not found. Invalid custom method." }));
      return;
  }
}

export async function update(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Update: To be implemented." }));
}

export async function remove(req: Request, res: Response): Promise<void> {
  res.statusCode = 200;
  res.end(JSON.stringify({ message: "Delete: To be implemented." }));
}

export async function authenticateToken(aToken: string): Promise<User> {
  const decoded = jwt.verify(aToken, tokenSecret) as any;
  const username = decoded.username;
  const docPath = apiName + '/' + username;
  const userRef = db.collection('users').doc(docPath);
  const findResult = await userRef.get();
  if (!findResult.exists) {
    throw new Error('Invalid token');
  }
  const foundUser = findResult.data() as User;
  return foundUser;
}
