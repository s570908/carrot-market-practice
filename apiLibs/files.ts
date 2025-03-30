import { UploadFilesResponse } from "@/types";
import aclient from "./aclient";

export async function uploadFiles(uploadCount: number) {
  const response = await aclient.put<UploadFilesResponse>(`/api/files?count=${uploadCount}`);
  return response.data;
}
