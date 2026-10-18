import dotenv from 'dotenv';
import mongoose from 'mongoose';
dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('Please provide MONGODB_URI in the .env file');
}

// Обработка событий подключения MongoDB
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Обработка завершения процесса
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});

async function connectDB() {
  try {
    const options = {
      serverSelectionTimeoutMS: 10000, // Таймаут выбора сервера 10 секунд
      socketTimeoutMS: 45000, // Таймаут сокета 45 секунд
      connectTimeoutMS: 10000, // Таймаут подключения 10 секунд
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    // Детальная информация об ошибке DNS
    if (error.name === 'MongoServerSelectionError' || error.code === 'ENOTFOUND') {
      console.error('\n🔍 Проблема с DNS или сетью:');
      console.error('1. Проверьте интернет-соединение');
      console.error('2. Проверьте правильность MONGODB_URI в .env файле');
      console.error('3. Убедитесь, что IP адрес добавлен в whitelist MongoDB Atlas');
      console.error('4. Проверьте настройки файрвола/антивируса');
      console.error('5. Попробуйте использовать другой DNS сервер (например, 8.8.8.8)');
    }

    // Не завершаем процесс сразу, чтобы можно было увидеть ошибку
    // process.exit(1);
    return false;
  }
}

export default connectDB;
