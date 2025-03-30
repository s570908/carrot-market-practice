import { UserID } from "@/apiLibs/atypes";
import { Fav, Kind, Product, ProductImage, Purchase, Review, Sale, User } from "@prisma/client";

export interface ProductPaging extends Product {
  images: ProductImage[];
  favs: {
    userId: number;
  }[];
  user: UserID;
  _count: {
    favs: number;
  };
}

export interface ProductsPagingResponse {
  ok: boolean;
  products: ProductPaging[];
  nextProducts: ProductPaging[];
}

export interface ProductWithFav extends Product {
  images: ProductImage[];
  favs: Fav[];
  _count: {
    favs: number;
  };
}

export interface ProductWithSale extends Product {
  images: ProductImage[];
  sales: Sale[];
  _count: {
    sales: number;
  };
}

export interface ProductWithPurchase extends Product {
  images: ProductImage[];
  purchases: Purchase[];
  _count: {
    purchases: number;
  };
}

export interface RecordWithProductWithFav {
  id: number;
  product: ProductWithFav;
}

export interface RecordWithProductWithSale {
  id: number;
  product: ProductWithSale;
}

export interface RecordWithProductWithPurchase {
  id: number;
  product: ProductWithPurchase;
}

export interface ProductListResponse {
  [key: string]: ProductListResponseMap[Kind];
}

export interface ProductListResponseFavs {
  [Kind.Fav]: RecordWithProductWithFav[];
}

export interface ProductListResponseSales {
  [Kind.Sale]: RecordWithProductWithSale[];
}

export interface ProductListResponsePurchases {
  [Kind.Purchase]: RecordWithProductWithPurchase[];
}

type ProductListResponseMap = {
  [Kind.Fav]: RecordWithProductWithFav[];
  [Kind.Sale]: RecordWithProductWithSale[];
  [Kind.Purchase]: RecordWithProductWithPurchase[];
};

interface ProductWithReview extends Review {
  createdBy: User;
}

export interface ProductWithUser extends Product {
  user: User;
  productReviews: ProductWithReview[];
  //images: ProductImage[]; // images 속성 추가
}

export interface ProductWithImages extends Product {
  images: ProductImage[];
}

// export interface ItemDetailResponse {
//   ok: boolean;
//   product: ProductWithUser;
//   relatedProducts: Product[];
//   isLike: boolean;
// }

// ProductWithDetails 인터페이스 정의
export interface ProductWithDetails extends Omit<Product, "createdAt" | "updatedAt"> {
  user: User;
  productReviews: {
    id: number;
    createdBy: User;
    review: string;
    score: number;
    createdAt: Date;
  }[];
  images: ProductImage[];
}

// RelatedProduct 인터페이스 정의
export interface RelatedProduct
  extends Omit<Product, "createdAt" | "updatedAt" | "description" | "status"> {
  user: User;
  images: ProductImage[];
}

export interface ProductDetailResponse {
  ok: boolean;
  isLike: boolean;
  product: ProductWithDetails;
  relatedProducts: RelatedProduct[];
}

export interface EditProductForm {
  name?: string;
  price?: number;
  description?: string;
  deletedImageIds?: string[];
  // photos: FileList;
}

export interface PreviewImage {
  id: string; // 고유 ID 필드
  kind: "Local" | "Cloudflare";
  url: string;
  file?: File | null;
  CLurl?: string;
}

export interface CLImage {
  imageId: string;
}

export interface CloudflareImage {
  id: string;
  kind: "Cloudflare";
  url: string;
  CLurl: string;
}

export interface UpdateProduct extends EditProductForm {
  images?: CLImage[];
}

// export interface ItemDetailResponse {
//   ok: boolean;
//   product: {
//     name: string;
//     price: number;
//     description: string;
//     images: CLImage[];
//     // photoId: string;
//   };
// }

export interface UploadProductForm {
  name: string;
  price: number;
  description: string;
  photo?: FileList;
}

export interface CLImage {
  imageId: string;
}

export interface UploadProduct extends UploadProductForm {
  images: CLImage[];
}

export interface UploadProductMutation {
  ok: boolean;
  products: Product;
}

export interface PreviewImage {
  id: string; // 고유 ID 필드
  kind: "Local" | "Cloudflare";
  url: string;
  file?: File | null;
  CLurl?: string;
}

export interface UpdateProductResponse {
  ok: boolean;
  message?: string;
  error?: string;
  product?: {
    id: number;
    name: string;
    price: number;
    description: string;
    images: {
      id: number;
      imageId: string;
    }[];
    // 기타 제품 관련 필드들
    createdAt?: Date;
    updatedAt?: Date;
    userId?: number;
    status?: string;
  };
}
