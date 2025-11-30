import User from './user.model';
import Task from './task.model';
import Product from './product.model';
import Order from './order.model';
import OrderProduct from './order-product.model';

User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Order.belongsToMany(Product, {
  through: OrderProduct,
  foreignKey: 'orderId',
  otherKey: 'productId',
  as: 'products',
});

Product.belongsToMany(Order, {
  through: OrderProduct,
  foreignKey: 'productId',
  otherKey: 'orderId',
  as: 'orders',
});

Order.hasMany(OrderProduct, {
  foreignKey: 'orderId',
  as: 'orderProducts',
});

OrderProduct.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

Product.hasMany(OrderProduct, {
  foreignKey: 'productId',
  as: 'orderProducts',
});

OrderProduct.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

export { User, Task, Product, Order, OrderProduct };
