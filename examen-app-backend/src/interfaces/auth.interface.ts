export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  token: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: string;
}
