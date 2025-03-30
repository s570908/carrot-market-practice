import aclient from "./aclient";

export async function deleteImageFromCloudflare(imageIds: string[]) {
  try {
    const response = await aclient.put("/api/cloudflare", { imageIds }); // 삭제 API 엔드포인트
    return response.data;
  } catch (error) {
    console.error("Cloudflare 이미지 삭제 실패:", error);
  }
}
