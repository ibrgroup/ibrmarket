import { logger } from './logger';

/**
 * Уровень критичности алерта
 */
export type AlertLevel = 'error' | 'critical';

/**
 * Контекст алерта - дополнительная информация об ошибке
 */
export interface AlertContext {
  [key: string]: unknown;
}

/**
 * Отправка webhook уведомления
 */
async function sendWebhookAlert(
  level: AlertLevel,
  message: string,
  context: AlertContext,
): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        level,
        message,
        context,
        timestamp: new Date().toISOString(),
        service: 'ibr-client',
        environment: process.env.NODE_ENV || 'development',
      }),
    });
  } catch (error) {
    // Логируем ошибку отправки webhook, но не прерываем выполнение
    logger.error('Failed to send webhook alert', {
      webhookUrl,
      originalError: message,
    });
  }
}

/**
 * Отправка email уведомления
 */
async function sendEmailAlert(
  level: AlertLevel,
  message: string,
  context: AlertContext,
): Promise<void> {
  const alertEmail = process.env.ALERT_EMAIL;
  if (!alertEmail) {
    return;
  }

  // Для отправки email можно использовать различные сервисы
  // В данном случае используем простой fetch к email API (например, SendGrid, Mailgun и т.д.)
  // Или можно использовать nodemailer для SMTP

  const emailApiUrl = process.env.EMAIL_API_URL;
  const emailApiKey = process.env.EMAIL_API_KEY;

  if (!emailApiUrl || !emailApiKey) {
    // Если нет настроенного email API, можно использовать внутренний endpoint
    // или пропустить отправку email
    return;
  }

  try {
    await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emailApiKey}`,
      },
      body: JSON.stringify({
        to: alertEmail,
        subject: `[${level.toUpperCase()}] ${message}`,
        text: `
Критичная ошибка в IBR-Client

Уровень: ${level}
Сообщение: ${message}
Контекст: ${JSON.stringify(context, null, 2)}
Время: ${new Date().toISOString()}
Окружение: ${process.env.NODE_ENV || 'development'}
        `.trim(),
        html: `
<h2>Критичная ошибка в IBR-Client</h2>
<p><strong>Уровень:</strong> ${level}</p>
<p><strong>Сообщение:</strong> ${message}</p>
<pre>${JSON.stringify(context, null, 2)}</pre>
<p><strong>Время:</strong> ${new Date().toISOString()}</p>
<p><strong>Окружение:</strong> ${process.env.NODE_ENV || 'development'}</p>
        `.trim(),
      }),
    });
  } catch (error) {
    // Логируем ошибку отправки email, но не прерываем выполнение
    logger.error('Failed to send email alert', {
      alertEmail,
      originalError: message,
    });
  }
}

/**
 * Отправка алерта через все настроенные каналы
 *
 * @param level - Уровень критичности (error или critical)
 * @param message - Сообщение об ошибке
 * @param context - Дополнительный контекст (userId, paymentId и т.д.)
 *
 * @example
 * ```typescript
 * await sendAlert('critical', 'Failed to save card after all retries', {
 *   userId: '123',
 *   paymentId: 'payment_456',
 *   paymentMethodId: 'pm_789',
 * });
 * ```
 */
export async function sendAlert(
  level: AlertLevel,
  message: string,
  context: AlertContext = {},
): Promise<void> {
  // 1. Структурированное логирование (всегда)
  if (level === 'critical') {
    logger.critical(message, context);
  } else {
    logger.error(message, context);
  }

  // 2. Webhook уведомление (если настроен ALERT_WEBHOOK_URL)
  await sendWebhookAlert(level, message, context).catch(() => {
    // Ошибка уже залогирована внутри функции
  });

  // 3. Email уведомление (если настроен ALERT_EMAIL)
  await sendEmailAlert(level, message, context).catch(() => {
    // Ошибка уже залогирована внутри функции
  });
}

/**
 * Утилита для отправки критичных алертов (сокращенная версия)
 */
export const alertCritical = (message: string, context?: AlertContext) =>
  sendAlert('critical', message, context || {});

/**
 * Утилита для отправки обычных алертов об ошибках (сокращенная версия)
 */
export const alertError = (message: string, context?: AlertContext) =>
  sendAlert('error', message, context || {});
