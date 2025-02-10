import axios from "axios";

export async function fetcher<T>(endpoint: string): Promise<T> {
  const response = await axios.get(endpoint);
  return response.data;
}
