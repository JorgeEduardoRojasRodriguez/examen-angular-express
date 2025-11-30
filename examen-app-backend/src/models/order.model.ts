import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IOrder {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderCreationAttributes extends Optional<IOrder, 'id' | 'createdAt' | 'updatedAt' | 'notes' | 'orderNumber'> {}

class Order extends Model<IOrder, OrderCreationAttributes> implements IOrder {
  public id!: string;
  public userId!: string;
  public orderNumber!: string;
  public status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  public totalAmount!: number;
  public shippingAddress!: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly user?: any;
  public readonly products?: any[];
}

Order.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    orderNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'order_number',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'total_amount',
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'shipping_address',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['user_id', 'status'] },
      { fields: ['created_at'] },
      { fields: ['order_number'], unique: true },
    ],
    hooks: {
      beforeCreate: async (order: Order) => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        order.orderNumber = `ORD-${timestamp}-${random}`;
      },
    },
  }
);

export default Order;
