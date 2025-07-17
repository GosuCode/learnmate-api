export interface User {
  id: string;
  email: string;
  name: string;
  password?: string | null;
  googleId?: string | null;
  avatar?: string | null;
  authProvider: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    authProvider: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  authProvider: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
} 