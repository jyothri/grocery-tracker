export interface GroceryItem {
  name?: string; // Unset during CreateGroceryItem request. Set otherwise. Format: "users/user1/groceryitems/gitem1"
  groceryItemName: string;
  expirationDate: string;
  purchaseDate: string;
  quantity: number;
  description?: string;
  createTime: string;
  updateTime: string;
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