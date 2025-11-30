import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface IOrderProduct {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderProductCreationAttributes extends Optional<IOrderProduct, 'id' | 'createdAt' | 'updatedAt' | 'subtotal'> {}

class OrderProduct extends Model<IOrderProduct, OrderProductCreationAttributes> implements IOrderProduct {
  public id!: string;
  public orderId!: string;
  public productId!: string;
  public quantity!: number;
  public unitPrice!: number;
  public subtotal!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderProduct.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT', // No permitir eliminar productos que están en órdenes
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unit_price',
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'order_products',
    timestamps: true,
    indexes: [
      { fields: ['order_id', 'product_id'], unique: true },
      { fields: ['order_id'] },
      { fields: ['product_id'] },
    ],
    hooks: {
      beforeCreate: async (orderProduct: OrderProduct) => {
        orderProduct.subtotal = orderProduct.quantity * orderProduct.unitPrice;
      },
      beforeUpdate: async (orderProduct: OrderProduct) => {
        if (orderProduct.changed('quantity') || orderProduct.changed('unitPrice')) {
          orderProduct.subtotal = orderProduct.quantity * orderProduct.unitPrice;
        }
      },
    },
  }
);

export default OrderProduct;
