import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Order, OrderProduct, Product, User } from '../models';
import { sequelize } from '../config/database';

export class OrderController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const status = req.query.status as string;
      const userId = req.query.userId as string;

      const where: any = {};

      if (userId) {
        where.userId = userId;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      const { count, rows: orders } = await Order.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Product,
            as: 'products',
            through: {
              attributes: ['quantity', 'unitPrice', 'subtotal'],
            },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: 'Orders retrieved successfully',
        data: {
          orders,
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

      const order = await Order.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Product,
            as: 'products',
            through: {
              attributes: ['quantity', 'unitPrice', 'subtotal'],
            },
          },
        ],
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Order retrieved successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const { shippingAddress, notes, items, userId: bodyUserId } = req.body;
      const userId = bodyUserId || (req as any).user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'Debe seleccionar un usuario para la orden',
        });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'La orden debe tener al menos un producto',
        });
        return;
      }

      const lastOrder = await Order.findOne({
        order: [['createdAt', 'DESC']],
        attributes: ['orderNumber'],
        transaction,
      });

      let nextNumber = 1;
      if (lastOrder && lastOrder.orderNumber) {
        const match = lastOrder.orderNumber.match(/EXM-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const orderNumber = `EXM-${nextNumber.toString().padStart(5, '0')}`;

      const order = await Order.create(
        {
          userId,
          orderNumber,
          shippingAddress,
          notes,
          status: 'pending',
          totalAmount: 0,
        },
        { transaction }
      );

      let totalAmount = 0;

      for (const item of items) {
        const product = await Product.findByPk(item.productId, { transaction });

        if (!product) {
          await transaction.rollback();
          res.status(400).json({
            success: false,
            message: `Product ${item.productId} not found`,
          });
          return;
        }

        if (product.stock < item.quantity) {
          await transaction.rollback();
          res.status(400).json({
            success: false,
            message: `Insufficient stock for product ${product.name}`,
          });
          return;
        }

        const subtotal = Number(product.price) * item.quantity;
        totalAmount += subtotal;

        await OrderProduct.create(
          {
            orderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: product.price,
            subtotal,
          },
          { transaction }
        );

        await product.update(
          { stock: product.stock - item.quantity },
          { transaction }
        );
      }

      await order.update({ totalAmount }, { transaction });
      await transaction.commit();

      const completeOrder = await Order.findByPk(order.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Product,
            as: 'products',
            through: {
              attributes: ['quantity', 'unitPrice', 'subtotal'],
            },
          },
        ],
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: completeOrder,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, shippingAddress, notes } = req.body;

      const order = await Order.findByPk(id);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      await order.update({ status, shippingAddress, notes });

      const updatedOrder = await Order.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
          {
            model: Product,
            as: 'products',
            through: {
              attributes: ['quantity', 'unitPrice', 'subtotal'],
            },
          },
        ],
      });

      res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        data: updatedOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderProduct,
            as: 'orderProducts',
            include: [{ model: Product, as: 'product' }],
          },
        ],
      });

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Order not found',
        });
        return;
      }

      if (order.status !== 'pending') {
        res.status(400).json({
          success: false,
          message: 'Only pending orders can be cancelled',
        });
        return;
      }

      for (const orderProduct of (order as any).orderProducts) {
        await orderProduct.product.update(
          { stock: orderProduct.product.stock + orderProduct.quantity },
          { transaction }
        );
      }

      await order.update({ status: 'cancelled' }, { transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await Order.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalRevenue'],
        ],
        group: ['status'],
      });

      const totalOrders = await Order.count();
      const totalRevenue = await Order.sum('totalAmount');

      res.status(200).json({
        success: true,
        data: {
          byStatus: stats,
          summary: {
            totalOrders,
            totalRevenue: totalRevenue || 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
