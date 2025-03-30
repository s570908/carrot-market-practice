export interface UploadFilesResponse {
  ok: boolean;
  uploadURLs: {
    id: string;
    uploadURL: string;
  }[];
}
