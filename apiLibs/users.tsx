import { Kind } from "@prisma/client";
import aclient from "./aclient";
import { ProductListResponse, ProfileResponse, UserResponse } from "./atypes";

export async function getProducts(kind: Kind) {
  const response = await aclient.get<ProductListResponse>(`/api/users/me/${kind}`);
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
