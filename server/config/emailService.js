import nodemailer from 'nodemailer';

// Получаем настройки SMTP из переменных окружения
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.mail.ru';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '465', 10);
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Валидация обязательных переменных окружения
if (!EMAIL_USER || !EMAIL_PASSWORD) {
  console.error(
    '❌ [EmailService] EMAIL_USER и EMAIL_PASSWORD должны быть установлены в .env файле',
  );
  console.error('Пример настройки в server/.env:');
  console.error('EMAIL_HOST=smtp.mail.ru');
  console.error('EMAIL_PORT=465');
  console.error('EMAIL_USER=your-email@mail.ru');
  console.error('EMAIL_PASSWORD=your-password');
}

// Configure the SMTP transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for port 465, false for other ports (587, etc.)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

// Function to send email
async function sendEmail(to, subject, text, html) {
  try {
    // Проверяем, что настройки SMTP корректны
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      throw new Error('SMTP не настроен: установите EMAIL_USER и EMAIL_PASSWORD в .env файле');
    }

    const info = await transporter.sendMail({
      from: EMAIL_USER, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('✅ [EmailService] Email отправлен успешно:', {
      to,
      messageId: info.messageId,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ [EmailService] Ошибка отправки email:', {
      to,
      error: error.message,
      code: error.code,
    });
    return { success: false, error: error.message };
  }
}

export { sendEmail };
