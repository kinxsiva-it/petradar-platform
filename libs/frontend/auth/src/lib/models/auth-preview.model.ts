export interface LoginPreviewForm {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterPreviewForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedGuidelines: boolean;
}

export interface AuthPreviewResult {
  ok: boolean;
  message: string;
}

