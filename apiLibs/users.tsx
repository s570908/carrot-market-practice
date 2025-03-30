import { Kind } from "@prisma/client";
import aclient from "./aclient";
import { MeResponse, ProfileResponse, UserResponse } from "./atypes";
import { getKindString } from "@libs/utils";
import {
  BaseMutation,
  EditProfileForm,
  EditProfileResponse,
  EnterForm,
  ProductListResponse,
  SellerRatingResponse,
} from "@/types";

export async function getProducts(kind: Kind) {
  //console.log("getProducts: kind---", kind);
  const kindStr = getKindString(kind);

  const response = await aclient.get<ProductListResponse>(`/api/users/enter`);
  return response.data;
}

export async function getSimpleProfile(otherId: number) {
  const response = await aclient.get<UserResponse>(`/api/users/${otherId}/simpleProfile`);
  return response.data;
}

export async function getOther(otherId: number) {
  const response = await aclient.get<ProfileResponse>(`/api/users/other/${otherId}`);
  return response.data;
}

export async function getMe() {
  const response = await aclient.get<MeResponse>(`/api/users/me`);
  return response.data;
}

export async function writeEnter(validForm: EnterForm) {
  const response = await aclient.post<BaseMutation>(`/api/users/enter`, validForm);
  return response.data;
}

export async function updateMe(profileData: EditProfileForm) {
  const response = await aclient.put<EditProfileResponse>(`/api/users/me`, profileData);
  return response.data;
}

export async function getSellerRating(sellerId: number) {
  const response = await aclient.get<SellerRatingResponse>(`/api/users/${sellerId}/rating`);
  return response.data;
}
