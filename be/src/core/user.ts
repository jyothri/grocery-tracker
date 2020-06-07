import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { db } from '../cloud/firestore';
import crypto from 'crypto';
import { CreateUserRequest, User, UpdateUserRequest } from './usertypes';


const tokenSecret = process.env.SECRET ? process.env.SECRET : '3ee058420bc2';
const apiName = 'api.jkurapati.com';

function mintToken(aUsername: string): string {
  return jwt.sign({
    username: aUsername
  }, tokenSecret, {
    expiresIn: '2 days'
  });
}

async function verifyEmailIsNotTaken(email: string): Promise<void> {
  const queryResult = await db.collection('users/' + apiName + '/users').where('email', '==', email).get();
  if (!queryResult.empty) {
    throw 'Email already in use.';
  }
}

async function validateCreateUserRequest(createUser: User): Promise<void> {
  if (createUser.name !== undefined) {
    throw `user specified resource id [${createUser.name}] not supported.`;
  }
  if (createUser.token !== undefined) {
    throw `token [${createUser.token}] should not be provided in create request.`;
  }
  if (!createUser.email) {
    throw 'email is required.';
  }
  await verifyEmailIsNotTaken(createUser.email);
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

export async function create(createUserRequest: CreateUserRequest, res: Response): Promise<void> {
  const userToCreate = createUserRequest.user;
  try {
    await validateCreateUserRequest(userToCreate);
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
  user.password = undefined;
  user.encryptedPassword = undefined;
  res.statusCode = 200;
  res.end(JSON.stringify(user));
}

export async function custom(loginUser: User, res: Response, arg: { [x: string]: string }): Promise<void> {
  if (!arg || !arg['custom_method']) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  const customMethod = arg['custom_method'];
  switch (customMethod) {
    case 'login':
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

export async function update(body: UpdateUserRequest, arg: { [x: string]: string }, res: Response): Promise<void> {
  const user = body.user;
  user.name = arg['user_id'];
  if (!user.name) {
    res.status(404).end(JSON.stringify({ message: "Invalid request. Missing name field." }));
    return;
  }
  const name = apiName + '/users' + '/' + user.name;
  const docRef = db.collection('users').doc(name);
  const findResult = await docRef.get();
  if (!findResult.exists) {
    throw new Error(`User not found: [${user.name}]`);
  }

  const dbUser = findResult.data() as User;
  const paths = body.mask.paths;
  const pathSet = new Set();
  for (const path of paths) {
    pathSet.add(path);
  }

  // Make requested mutations
  if (pathSet.has('user.email')) {
    if (!user.email) {
      throw new Error('email cannot be updated to blank value.');
    }
    await verifyEmailIsNotTaken(user.email);
    dbUser.email = user.email;
  }
  if (pathSet.has('user.password')) {
    dbUser.password = await bcrypt.hash(user.password, 5);
  }
  await docRef.set(dbUser);
  const updatedUser = (await docRef.get()).data() as User;
  if (!updatedUser.name) {
    throw new Error(`name field is blank in db for user. This should never happen.`);
  }
  updatedUser.encryptedPassword = undefined;
  updatedUser.password = undefined;
  updatedUser.token = mintToken(updatedUser.name);
  res.status(200).end(JSON.stringify(updatedUser));
}

export async function remove(urlPath: { [x: string]: string }, res: Response): Promise<void> {
  const userPath = apiName + '/users' + '/' + urlPath['user_id'];
  const userRef = db.collection('users').doc(userPath);
  const user = await userRef.get();
  if (!user.exists) {
    throw new Error(`User not found: [${userPath}]`);
  }
  await userRef.delete();
  res.status(200).end();
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
