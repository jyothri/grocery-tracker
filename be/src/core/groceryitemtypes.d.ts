export class GroceryItem {
  name?: string; // Unset during createUser request. Set otherwise. Format: "users/user1"
  email?: string; // Optional
  password?: string; // Mandatory only for login
  image?: string; // Optional
  token?: string; // Unset during createUser request. Set otherwise.
  encryptedPassword?: string // Set for db operations only. Not exposed to API.
}

export interface CreateGroceryItemRequest {
  parent: string;
  groceryItem: GroceryItem;
}

export interface GetGroceryItemRequest {
  // The field will contain name of the resource requested
  // format: "users/user1/grocery_items/gitem1"
  name: string;
}

export interface UpdateGroceryItemRequest {
  groceryItem: GroceryItem;
  mask: UpdateGroceryItemFieldMask;
}

export interface UpdateGroceryItemFieldMask {
  paths: string[];
}