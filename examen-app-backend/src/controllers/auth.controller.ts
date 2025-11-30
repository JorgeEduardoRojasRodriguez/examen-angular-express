import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';
import { ILoginRequest, ILoginResponse, IJwtPayload, IUserCreate } from '../interfaces';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password }: ILoginRequest = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const payload: IJwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const signOptions: SignOptions = {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
      };

      const token = jwt.sign(payload, config.jwt.secret, signOptions);

      const response: ILoginResponse = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
      };

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: response,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: IUserCreate = req.body;
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado',
        });
        return;
      }

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'Cuenta creada exitosamente',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
