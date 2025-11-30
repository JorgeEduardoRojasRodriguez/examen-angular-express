import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { IUserCreate, IUserUpdate } from '../interfaces';

export class UserController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: IUserCreate = req.body;
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
        return;
      }

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: users } = await User.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: users.map((user) => user.toJSON()),
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: IUserUpdate = req.body;

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({ where: { email: updateData.email } });
        if (existingUser) {
          res.status(400).json({
            success: false,
            message: 'Email already registered',
          });
          return;
        }
      }

      await user.update(updateData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
