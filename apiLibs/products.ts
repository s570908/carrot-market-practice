import aclient from "./aclient";
import {
  ItemDetailResponse,
  ProductDetailResponse,
  ProductsPagingResponse,
  ReservationResponse,
  ReviewData,
  ReviewResponse,
  ReviewWritableResponse,
  SellCompleteResponse,
  ToggleFavResponse,
  ToggleReservationResponse,
} from "./atypes";
import { ReviewType } from "@prisma/client";

export async function getProductsPaging(page: number, limit: number) {
  const response = await aclient.get<ProductsPagingResponse>(
    `/api/products?page=${page}&limit=${limit}`
  );
  //console.log("getProductsPaging: ", response.data);
  return response.data;
}

export async function getReservation(id: number) {
  const response = await aclient.get<ReservationResponse>(`/api/products/${id}/reservation`);
  return response.data;
}

export async function writeToggleReservation(params: { productId: number; buyerId: number }) {
  const { productId, buyerId } = params;
  const response = await aclient.post<ToggleReservationResponse>(
    `/api/products/${productId}/reservation`,
    { buyerId }
  );
  return response.data;
}

export async function writeToggleFav(id: number) {
  const response = await aclient.post<ToggleFavResponse>(`/api/products/${id}/fav`);
  return response.data;
}

export async function getReviewWritable(params: {
  productId: number;
  otherId: number;
  reviewType: ReviewType;
}) {
  const { productId, otherId, reviewType } = params;
  const response = await aclient.get<ReviewWritableResponse>(
    `/api/products/${productId}/checkReviewWritable?createdForId=${otherId}&reviewType=${reviewType}`
  );
  return response.data;
}

export async function getProduct(id: number) {
  const response = await aclient.get<ProductDetailResponse>(`/api/products/${id}`);
  return response.data;
}

export async function writeSellComplete(params: { productId: number; buyerId: number }) {
  console.log("writeSellComplete: ", params);
  const { productId, buyerId } = params;
  const response = await aclient.post<SellCompleteResponse>(`/api/products/${productId}`, {
    buyerId,
  });
  return response.data;
}

export async function writeReview(params: { reviewData: ReviewData; productId: number }) {
  const { reviewData, productId } = params;
  const response = await aclient.post<ReviewResponse>(
    `/api/products/${productId}/review`,
    reviewData
  );
  return response.data;
}
