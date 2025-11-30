import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ITask } from '../interfaces';
import User from './user.model';

interface TaskCreationAttributes extends Optional<ITask, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'description' | 'dueDate'> {}

class Task extends Model<ITask, TaskCreationAttributes> implements ITask {
  public id!: string;
  public title!: string;
  public description!: string;
  public status!: 'pending' | 'in_progress' | 'completed';
  public priority!: 'low' | 'medium' | 'high';
  public userId!: string;
  public dueDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Task.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed'),
      defaultValue: 'pending',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date',
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
    tableName: 'tasks',
    timestamps: true,
  }
);

Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });

export default Task;
