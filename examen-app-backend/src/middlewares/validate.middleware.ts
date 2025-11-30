import { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  label?: string; // Nombre en español para mostrar
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

const fieldLabels: Record<string, string> = {
  shippingAddress: 'Dirección de envío',
  items: 'Productos',
  email: 'Correo electrónico',
  password: 'Contraseña',
  firstName: 'Nombre',
  lastName: 'Apellido',
  title: 'Título',
  description: 'Descripción',
  name: 'Nombre',
  price: 'Precio',
  stock: 'Stock',
  category: 'Categoría',
  status: 'Estado',
  notes: 'Notas',
  quantity: 'Cantidad',
};

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];
      const label = rule.label || fieldLabels[rule.field] || rule.field;

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${label} es requerido`);
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rule.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push(`${label} debe ser un correo válido`);
        }
      } else if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${label} debe ser una lista`);
        } else if (value.length === 0) {
          errors.push(`Debe agregar al menos un producto`);
        }
      } else if (rule.type && typeof value !== rule.type) {
        const typeNames: Record<string, string> = {
          string: 'texto',
          number: 'número',
          boolean: 'verdadero/falso',
        };
        errors.push(`${label} debe ser ${typeNames[rule.type] || rule.type}`);
      }

      if (rule.type === 'string' || rule.type === 'email') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${label} debe tener al menos ${rule.minLength} caracteres`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${label} debe tener máximo ${rule.maxLength} caracteres`);
        }
      }

      if (rule.type === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${label} debe ser al menos ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${label} debe ser máximo ${rule.max}`);
        }
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors,
      });
      return;
    }

    next();
  };
};
