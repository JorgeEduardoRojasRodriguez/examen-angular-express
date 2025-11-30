import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Task, User } from '../models';
import { ITaskCreate, ITaskUpdate } from '../interfaces';

export class TaskController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskData: ITaskCreate = {
        ...req.body,
        userId: req.user?.userId, // Get user ID from JWT token
      };

      const task = await Task.create(taskData);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
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
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const search = req.query.search as string;

      const whereClause: Record<string, unknown> = {};

      if (req.user?.role !== 'admin') {
        whereClause.userId = req.user?.userId;
      }

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      if (priority && priority !== 'all') {
        whereClause.priority = priority;
      }

      if (search) {
        whereClause[Op.or as any] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows: tasks } = await Task.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: {
          tasks,
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

      const task = await Task.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      });

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      if (req.user?.role !== 'admin' && task.userId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: ITaskUpdate = req.body;

      const task = await Task.findByPk(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      if (req.user?.role !== 'admin' && task.userId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      await task.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const task = await Task.findByPk(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      if (req.user?.role !== 'admin' && task.userId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      await task.destroy();

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
