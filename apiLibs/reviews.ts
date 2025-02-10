import aclient from "./aclient";
import { ReviewsResponse } from "./atypes";

export async function getReviews() {
  const response = await aclient.get<ReviewsResponse>(`/api/reviews`);
  return response.data;
}
