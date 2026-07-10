export interface CreateProductRequest {
  productName: string;
  productPrice: number;
  productDescription: string;
  vendorId: number;
}

export interface UpdateProductRequest {
  productName?: string;
  productPrice?: number;
  productDescription?: string;
}

export interface ProductResponse {
  productId: number;
  productName: string;
  productPrice: number;
  productDescription: string;
  vendorId: number;
  vendorCompanyName: string;
}
