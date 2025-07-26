import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, CreateUserRequest, LoginRequest, AuthResponse } from '@/types/user';
import { appConfig } from '@/config';
import { prisma } from '@/lib/prisma';

export class UserService {
  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const { email, name, password } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      }
    });

    // Generate JWT token
    const token = this.generateToken(newUser.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        authProvider: newUser.authProvider,
        emailVerified: newUser.emailVerified,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      token,
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    if (!user.password) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return user;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        authProvider: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return users;
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user || !user.password) {
      throw new Error('User not found or password not set');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });
  }


  verifyToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, appConfig.jwt.secret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      return null;
    }
  }

  public generateToken(userId: string): string {
    const payload = {
      userId: userId,
    };

    if (!appConfig.jwt.secret) {
      throw new Error('JWT secret is not configured');
    }

    return jwt.sign(payload, appConfig.jwt.secret);
  }
} 