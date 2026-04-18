export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  taqueriaId: string;
  createdAt: number;
};

export type CreateProductPayload = {
  name: string;
  price: number;
  taqueriaId: string;
  imageUri?: string;
};

export type UpdateProductPayload = {
  productId: string;
  taqueriaId: string;
  name: string;
  price: number;
  newImageUri?: string; // Only set if the user selected a new image
  existingImageUrl?: string; // We use this to delete the old one when a new image is uploaded or if keeping it
};
