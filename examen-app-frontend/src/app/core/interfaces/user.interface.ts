export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'user';
}

export interface UserUpdate {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}
