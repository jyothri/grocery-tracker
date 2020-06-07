import * as bcrypt from 'bcrypt';
import { db } from '../cloud/firestore';
import crypto from 'crypto';
import { CreateUserRequest, User, UpdateUserRequest } from './usertypes';
import * as tokenHelper from './token_helper';


const apiName = 'api.jkurapati.com';

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

function prepareForReturn(user: User): void {
  if (!user.name) {
    throw Error('name is not defined. This should never happen.');
  }
  user.token = tokenHelper.mintToken(user.name);
  user.password = undefined;
  user.encryptedPassword = undefined;
}

export async function create(createUserRequest: CreateUserRequest): Promise<User> {
  const userToCreate = createUserRequest.user;
  await validateCreateUserRequest(userToCreate);
  userToCreate.name = 'users' + '/' + crypto.randomBytes(8).toString('hex');
  userToCreate.encryptedPassword = await bcrypt.hash(userToCreate.password, 5);
  userToCreate.password = '';
  const docPath = apiName + '/' + userToCreate.name;

  console.log('Creating document ', userToCreate.name);
  const userRef = db.collection('users').doc(docPath);
  await userRef.set(userToCreate);

  prepareForReturn(userToCreate);
  return userToCreate;
}

export async function get(userName: string): Promise<User> {
  const name = apiName + '/' + userName;
  const docRef = db.collection('users').doc(name);
  const findResult = await docRef.get();
  const user = findResult.data();
  if (!user) {
    throw Error(`User not found: [${name}]`);
  }
  prepareForReturn(user);
  return user;
}

export async function custom(loginUser: User, customMethod: string): Promise<User> {
  switch (customMethod) {
    case 'login':
      if (!loginUser.email) {
        throw Error(`email is mandatory`);
      }

      const foundUser = await getUserByEmail(loginUser.email);
      if (!foundUser || !foundUser.encryptedPassword) {
        throw Error(`credentials not found for [${loginUser.email}]. This should never happen.`);
      }

      if (!foundUser.name) {
        throw Error(`name not found for [${loginUser.email}]. This should never happen.`);
      }

      const passwordCheckResult = await bcrypt.compare(loginUser.password, foundUser.encryptedPassword);
      if (!passwordCheckResult) {
        throw Error(`Invalid password.`);
      }

      prepareForReturn(foundUser);
      return foundUser;
    default:
      throw Error(`Not found. Invalid custom method ${customMethod}.`);
  }
}

export async function update(body: UpdateUserRequest, arg: { [x: string]: string }): Promise<User> {
  const user = body.user;
  user.name = arg['user_id'];
  if (!user.name) {
    throw Error(`Invalid request. Missing name field.`);
  }
  const name = apiName + '/users' + '/' + user.name;
  const docRef = db.collection('users').doc(name);
  const findResult = await docRef.get();
  if (!findResult.exists) {
    throw Error(`User not found: [${user.name}]`);
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
      throw Error('email cannot be updated to blank value.');
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
    throw Error(`name field is blank in db for user. This should never happen.`);
  }
  prepareForReturn(updatedUser);
  return updatedUser;
}

export async function remove(urlPath: { [x: string]: string }): Promise<void> {
  const userPath = apiName + '/users' + '/' + urlPath['user_id'];
  const userRef = db.collection('users').doc(userPath);
  const user = await userRef.get();
  if (!user.exists) {
    throw Error(`User not found: [${userPath}]`);
  }
  await userRef.delete();
}
