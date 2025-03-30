export interface EditProfileForm {
  email?: string;
  phone?: string;
  name?: string;
  avatar?: FileList;
  avatarId?: string;
  formErrors?: string;
}

export interface EditProfileResponse {
  ok: boolean;
  error?: string;
  profile?: {
    id: number;
    email: string | null;
    phone: string | null;
    name: string | null;
    avatar: string | null;
    createdAt: Date;
    updatedAt: Date;
    // 기타 사용자 관련 필드
  };
}

export interface SellerRatingResponse {
  ok: boolean;
  averageScore: number;
  reviewCount: number;
}
