export class User {
  name?: string; // Unset during createUser request. Set otherwise. Format: "users/user1"
  email?: string; // Optional
  password?: string; // Mandatory only for login
  image?: string; // Optional
  token?: string; // Unset during createUser request. Set otherwise.
  encryptedPassword?: string // Set for db operations only. Not exposed to API.
}

export interface CreateUserRequest {
  user: User;
}

export interface GetUserRequest {
  // The field will contain name of the resource requested
  // format: "users/user1"
  name: string;
}

export interface UpdateUserRequest {
  user: User;
  mask: UpdateUserFieldMask;
}

export interface UpdateUserFieldMask {
  paths: string[];
}