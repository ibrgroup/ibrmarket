import mongoose from 'mongoose';

/**
 * Middleware для проверки подключения к базе данных
 * Возвращает ошибку, если БД не подключена
 */
export const checkDatabaseConnection = (req, res, next) => {
  // Проверяем состояние подключения MongoDB
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: true,
      success: false,
      message: 'База данных не подключена. Пожалуйста, попробуйте позже.',
      dbStatus: {
        readyState: mongoose.connection.readyState,
        states: {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting',
        },
      },
    });
  }
  next();
};

