import { Kind } from "@prisma/client";
import aclient from "./aclient";
import { ProductListResponse, ProfileResponse, UserResponse } from "./atypes";
import { getKindString } from "@libs/utils";

export async function getProducts(kind: Kind) {
  //console.log("getProducts: kind---", kind);
  const kindStr = getKindString(kind);

  const response = await aclient.get<ProductListResponse>(`/api/users/me/${kindStr}`);
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
