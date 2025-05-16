import { ProductWithImages } from "@/types";
import {
  Fav,
  Product,
  Purchase,
  Sale,
  SellerChat,
  User as PrismaUser,
  Review,
  Reservation,
  Post,
  Answer,
  ChatRoom,
  User,
  ReviewType,
  Kind,
  Stream,
  ProductImage,
  Prisma,
  MessageType,
  ChatMeetup,
} from "@prisma/client";

/// User

// interface User {
//   name: string;
//   avatar: string | null;
//   id: number;
// }

export interface MeResponse extends User {
  ok: boolean;
  profile: User;
}

export interface UserResponse extends User {
  ok: boolean;
  other: User;
}

export interface UserID {
  userId: number;
}

interface ProductScore extends Product {
  productReviews: Review[];
}

interface ProfileWithReview extends User {
  sales: [
    {
      product: ProductScore;
    }
  ];
}

export interface ProfileResponse {
  ok: boolean;
  other: ProfileWithReview;
}

// // Product Paging

// export interface ProductPaging {
//   id: number;
//   createdAt: string;
//   updatedAt: string;
//   userId: number;
//   images: ProductImage[];
//   name: string;
//   price: number;
//   description: string;
//   status: string;
//   favs: {
//     userId: number;
//   }[];
//   user: UserID;
//   _count: {
//     favs: number;
//   };
// }

// export interface ProductPaging extends Product {
//   images: ProductImage[];
//   favs: {
//     userId: number;
//   }[];
//   user: UserID;
//   _count: {
//     favs: number;
//   };
// }

// export interface ProductsPagingResponse {
//   ok: boolean;
//   products: ProductPaging[];
//   nextProducts: ProductPaging[];
// }

//// ChatRoom

// interface ChatRoom {
//   id: number;
//   buyerId: number;
//   buyer: User;
//   sellerId: number;
//   seller: User;
//   productId: number;
//   product: Product;
//   recentMsg?: {
//     userId: number;
//     chatMsg: string;
//     createdAt: string;
//     updatedAt?: string; // updatedAt 속성을 추가합니다.
//   };
//   unreadCount: number;
// }

export enum ChatRoomType {
  Seller = "seller",
  Buyer = "buyer",
  All = "all",
}

export interface ChatRoomID {
  id: number;
  product: ProductWithImages;
  recentMsg: string;
}

export interface ChatRoomIDsResponse {
  ok: boolean;
  sellerChatRoomList: ChatRoomID[];
}

export interface ChatRoomResponse {
  ok: boolean;
  chatRoom: ChatRoom;
}

interface RecentMsg {
  id: number;
  chatMsg: string;
  createdAt: string;
  //isNew?: boolean;
  userId?: number;
  updatedAt?: string;
}

// interface ChatRoomByKey {
//   id: number;
//   product: {
//     id: number;
//     name: string;
//     price: number;
//   };
//   recentMsg: RecentMsg;
// }

export interface ChatRoomsByKeyResponse {
  ok: boolean;
  sellerChatRoomList: ChatRoomByProduct[];
}

export interface ChatRoomById {
  id: number;
  buyerId: number;
  buyer: User;
  sellerId: number;
  seller: User;
  product: ProductWithImages;
  recentMsg?: {
    userId: number;
    chatMsg: string;
    createdAt: string;
    updatedAt?: string; // updatedAt 속성을 추가합니다.
  };
  unreadCount: number;
}

export interface ChatRoomByIdResponse {
  ok: boolean;
  chatRoom: ChatRoomById;
}

// Product 모델과 관련된 모든 관계를 포함한 타입 정의
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    favs: true;
    records: true;
    Reservations: true;
    images: true;
  };
}>;

export interface ChatRoomByProduct {
  id: number;
  product: ProductWithImages;
  recentMsg: RecentMsg;
  buyer: {
    name: string;
    avatar: string;
    id: number;
  };
  seller: {
    name: string;
    avatar: string;
    id: number;
  };
  sellerChat: {
    chatMsg: string;
    //isNew: boolean;
    user: {
      id: number;
      name: string;
      avatar: string;
    };
  }[];
  unreadCount: number;
}

// export interface ChatRoomByProduct {
//   id: number;
//   product: {
//     id: number;
//     userId: number;
//     name: string;
//     images: ProductImage[];
//     price: number;
//     status: string;
//   };
//   recentMsg: RecentMsg;
//   buyer: {
//     name: string;
//     avatar: string;
//     id: number;
//   };
//   seller: {
//     name: string;
//     avatar: string;
//     id: number;
//   };
//   sellerChat: {
//     chatMsg: string;
//     isNew: boolean;
//     user: {
//       id: number;
//       name: string;
//       avatar: string;
//     };
//   }[];
//   unreadCount: number;
// }

export interface ChatRoomsByProductResponse {
  ok: boolean;
  chatRoomListWithUnreadCount: ChatRoomByProduct[];
}

interface ChatRoomCreate {
  id: number;
  buyerId: number;
  sellerId: number;
  productId: number;
  recentMsgId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoomCreateResponse {
  ok: boolean;
  chatRoom?: ChatRoom;
  //isNew: boolean;
  error?: string;
}

//// Product

// export enum ProductKind {
//   Favs = "favs",
//   Sales = "sales",
//   Purchases = "purchases",
// }

// export interface ProductWithFav extends Product {
//   images: ProductImage[];
//   favs: Fav[];
//   _count: {ㅁ
//     favs: number;
//   };
// }

// export interface ProductWithSale extends Product {
//   images: ProductImage[];
//   sales: Sale[];
//   _count: {
//     sales: number;
//   };
// }

// export interface ProductWithPurchase extends Product {
//   images: ProductImage[];
//   purchases: Purchase[];
//   _count: {
//     purchases: number;
//   };
// }

// export interface RecordWithProductWithFav {
//   id: number;
//   product: ProductWithFav;
// }

// export interface RecordWithProductWithSale {
//   id: number;
//   product: ProductWithSale;
// }

// export interface RecordWithProductWithPurchase {
//   id: number;
//   product: ProductWithPurchase;
// }

// export interface ProductListResponse {
//   [key: string]: ProductListResponseMap[Kind];
// }

// export interface ProductListResponseFavs {
//   [Kind.Fav]: RecordWithProductWithFav[];
// }

// export interface ProductListResponseSales {
//   [Kind.Sale]: RecordWithProductWithSale[];
// }

// export interface ProductListResponsePurchases {
//   [Kind.Purchase]: RecordWithProductWithPurchase[];
// }

// type ProductListResponseMap = {
//   [Kind.Fav]: RecordWithProductWithFav[];
//   [Kind.Sale]: RecordWithProductWithSale[];
//   [Kind.Purchase]: RecordWithProductWithPurchase[];
// };

interface ReservationWithUser extends Reservation {
  user: User;
}

export interface ReservationResponse {
  ok: boolean;
  isReserved: boolean;
  reserve: ReservationWithUser;
}

// 응답 데이터 인터페이스 정의
interface UserForToggelReservation {
  id: number;
  name: string;
}

interface ReservationForToggleReservation {
  id: number;
  productId: number;
  userId: number;
  user: UserForToggelReservation;
}

export interface ToggleReservationResponse {
  ok: boolean;
  isReserved: boolean;
  reserve?: ReservationForToggleReservation;
}

export interface ToggleFavResponse {
  ok: boolean;
  error?: string;
}

export interface ReviewResponse {
  ok: boolean;
  error?: string;
  writtenReview?: Review;
}

// ReviewType 열거형 정의
// export enum ReviewType {
//   SellerReview = "SellerReview",
//   BuyerReview = "BuyerReview",
// }

// ResponseType 인터페이스 정의
export interface ReviewWritableResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

export interface SellCompleteResponse {
  ok: boolean;
  purchaseProduct: {
    id: number;
    userId: number;
    productId: number;
  };
  saleProduct: {
    id: number;
    userId: number;
    productId: number;
  };
}

// interface ProductWithReview extends Review {
//   createdBy: User;
// }

// export interface ProductWithUser extends Product {
//   user: User;
//   productReviews: ProductWithReview[];
//   //images: ProductImage[]; // images 속성 추가
// }

// export interface ProductWithImages extends Product {
//   images: ProductImage[];
// }

// export interface ItemDetailResponse {
//   ok: boolean;
//   product: ProductWithUser;
//   relatedProducts: Product[];
//   isLike: boolean;
// }

// // ProductWithDetails 인터페이스 정의
// export interface ProductWithDetails extends Omit<Product, "createdAt" | "updatedAt"> {
//   user: User;
//   productReviews: {
//     id: number;
//     createdBy: User;
//     review: string;
//     score: number;
//     createdAt: Date;
//   }[];
//   images: ProductImage[];
// }

// // RelatedProduct 인터페이스 정의
// export interface RelatedProduct
//   extends Omit<Product, "createdAt" | "updatedAt" | "description" | "status"> {
//   user: User;
//   images: ProductImage[];
// }

// export interface ProductDetailResponse {
//   ok: boolean;
//   isLike: boolean;
//   product: ProductWithDetails;
//   relatedProducts: RelatedProduct[];
// }

export interface ReviewData {
  review: string;
  score: number;
  reviewType: ReviewType;
  createdForId: number;
}

//// ChatRoomList

interface ReservationWithUser extends Reservation {
  user: User;
}

interface Payload {
  buyerId: string | undefined; // user?.id가 undefined일 수 있으므로 | undefined를 추가
  itemId: number; // 가정으로 number 타입이라고 지정했습니다. 실제 타입에 맞게 수정해야 합니다.
  eventName: string;
}

interface ChatRoomWithUnreadCount {
  id: number;
  createdAt: string;
  updatedAt: string;
  productId: number;
  buyerId: number;
  sellerId: number;
  recentMsg: {
    chatMsg: string;
    //isNew: boolean;
    userId: number;
    createdAt: string;
    updatedAt: string;
  };
  buyer: {
    name: string;
    avatar: string;
    id: number;
  };
  seller: {
    name: string;
    avatar: string;
    id: number;
  };
  product: ProductWithImages;
  sellerChat: {
    chatMsg: string;
    //isNew: boolean;
    user: {
      id: number;
      name: string;
      avatar: string;
    };
  }[];
  unreadCount: number;
}

interface ChatRoomListWithUnreadCountResponse {
  ok: boolean;
  chatRoomListWithUnreadCount: ChatRoomWithUnreadCount[];
}

//// Chat

export interface ChatFormResponse {
  chatMsg: string;
}

export interface ChatMessageResponse {
  ok: boolean;
  sellerChat: {
    id: number;
    chatMsg: string;
    user: {
      id: number;
    };
    createdAt: string;
    chatRoomId: number;
  };
}

export type UserWithwrittenReviews = PrismaUser & {
  writtenReviews: Review[];
};

export interface ChatWithUser extends SellerChat {
  user: UserWithwrittenReviews;
  chatMeetup?: ChatMeetup;
}

// API 응답 인터페이스 정의
export interface ChatResponse {
  ok: boolean;
  sellerChat: ChatWithUser[];
  chatRoomOfSeller: {
    buyerId: number;
    sellerId: number;
    productId: number;
    buyer: UserWithwrittenReviews;
    seller: UserWithwrittenReviews;
    product: ProductWithImages;
  };
}

////

//// post

interface AnswerWithUser extends Answer {
  user: User;
}

interface PostWithUser extends Post {
  user: User;
  _count: {
    answers: number;
    wonderings: number;
  };
  answers: AnswerWithUser[];
}

export interface CommunityPostResponse {
  ok: boolean;
  post: PostWithUser;
  isWondering: boolean;
}

export interface WriteCommunityPostResponse {
  ok: boolean;
  error?: string;
}

export interface AnswerForm {
  answer: string;
}

export interface AnswerResponse {
  ok: boolean;
  answer: Answer;
}

//// Profile

//// Review

interface ReviewWithUser extends Review {
  createdBy: User;
}

export interface ReviewsResponse {
  ok: boolean;
  reviews: ReviewWithUser[];
}

//// Stream

export interface StreamsResponse {
  ok: boolean;
  streams: Stream[];
  result: [];
}

export interface StreamDetailFormData {
  message: string;
}

interface RecordedVideo {
  uid: string;
  meta: { name: string };
  preview: string;
  liveInput: string;
  thumbnail: string;
  thumbnailTimestampPct: number;
  allowedOrigins: any[];
  size: number;
  input: { width: number; height: number };
  playback: { hls: string; dash: string };
  status: {
    state: string;
    pctComplete: string;
    errorReasonCode: string;
    errorReasonText: string;
  };
  creator: any;
  duration: number;
  maxDurationSeconds: any;
  maxSizeBytes: any;
  modified: string;
  readyToStream: boolean;
  requireSignedURLs: boolean;
  uploadExpiry: any;
  watermark: any;
  created: string;
  uploaded: string;
}

interface RecordedVideos {
  success: boolean;
  errors: any[];
  messages: any[];
  result: RecordedVideo[];
}

interface StreamMessage {
  message: string;
  id: number;
  user: {
    avatar?: string;
    id: number;
    name: string;
  };
}
interface StreamWithMessages extends Stream {
  messages: StreamMessage[];
  user: User; // 없애야 할 것 같다. 중복!
}

export interface StreamDetailResult extends ApiResponseType {
  stream?: StreamWithMessages;
  recordedVideos?: RecordedVideos;
}

export interface ViewsResult {
  liveViewers: number;
}

export interface LifecycleResult {
  isInput: boolean;
  live: boolean;
  status: string;
  videoUID: string | null;
}

export interface MessageData {
  message: string;
}

interface StreamMessage {
  id: number;
  message: string;
  createdAt: string;
  updatedAt: string;
  streamId: number;
  userId: number;
}

export interface StreamDetailResponse {
  ok: boolean;
  message: string;
  stream?: StreamWithMessages;
  recordedVideos?: RecordedVideo[];
}

export interface StreamMessageResponse {
  ok: boolean;
  streamMessage?: StreamMessage;
  message?: string;
}

export interface ApiResponseType {
  ok: boolean;
  [key: string]: any | undefined;
}

export type MethodType = "GET" | "POST" | "DELETE" | "PATCH" | "PUT";

export { Kind };

// ChatMeetup 생성을 위한 인터페이스
export interface ChatMeetupParams {
  appointmentTime: Date; //format UTC date-time string
  place: string;
  locationLatitude: number | null;
  locationLongitude: number | null;
  alertTime: string;
  chatRoomId: number;
}

// ChatMeetup 응답 인터페이스
export interface ChatMeetupResponse {
  ok: boolean;
  chatMeetup?: ChatMeetup;
  message?: any;
  error?: string;
}

// Chat message interface
export interface ChatMessage {
  id: number;
  createdAt: string;
  updatedAt: string;
  userId?: number;
  chatMsg: string;
  chatRoomId: number;
  messageType?: MessageType;
  user?: {
    name: string;
    avatar: string;
  };
  chatMeetup?: ChatMeetup;
}

// SystemMessage 응답 인터페이스
export interface SystemMessageResponse {
  ok: boolean;
  systemMessage?: {
    id: number;
    chatMsg: string;
    messageType: string;
    createdAt: string;
    updatedAt: string;
    chatRoomId: number;
    chatMeetup?: any;
  };
  error?: string;
}

export interface SystemMessageParams {
  chatRoomId: number;
  message: string;
  meta?: Record<string, any>;
}
