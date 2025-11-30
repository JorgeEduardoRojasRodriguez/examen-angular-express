import app from './app';
import { config, connectDB } from './config';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(config.server.port, () => {
      console.log('========================================');
      console.log(`🚀 Server running on port ${config.server.port}`);
      console.log(`📍 Environment: ${config.server.nodeEnv}`);
      console.log(`🔗 URL: http://localhost:${config.server.port}`);
      console.log('========================================');
      console.log('Available endpoints:');
      console.log('  GET  /health');
      console.log('  POST /api/auth/login');
      console.log('  POST /api/users');
      console.log('  GET  /api/users');
      console.log('  GET  /api/users/:id');
      console.log('  PUT  /api/users/:id');
      console.log('  DELETE /api/users/:id');
      console.log('  POST /api/tasks');
      console.log('  GET  /api/tasks');
      console.log('  GET  /api/tasks/:id');
      console.log('  PUT  /api/tasks/:id');
      console.log('  DELETE /api/tasks/:id');
      console.log('  --- SQL Relacional (Products & Orders) ---');
      console.log('  POST /api/products');
      console.log('  GET  /api/products');
      console.log('  GET  /api/products/:id');
      console.log('  PUT  /api/products/:id');
      console.log('  DELETE /api/products/:id');
      console.log('  POST /api/orders');
      console.log('  GET  /api/orders');
      console.log('  GET  /api/orders/stats');
      console.log('  GET  /api/orders/:id');
      console.log('  PUT  /api/orders/:id');
      console.log('  PUT  /api/orders/:id/status');
      console.log('  DELETE /api/orders/:id');
      console.log('  --- Firebase Notifications (FCM) ---');
      console.log('  POST /api/notifications/send');
      console.log('  POST /api/notifications/send-multicast');
      console.log('  POST /api/notifications/send-topic');
      console.log('  POST /api/notifications/test');
      console.log('========================================');
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

startServer();
