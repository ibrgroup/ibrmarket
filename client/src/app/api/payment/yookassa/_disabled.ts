import { NextResponse } from 'next/server';

/**
 * Legacy Next BFF payment gateway — disabled.
 * Use authenticated backend: POST /api/order/payment/yookassa/*
 */
export function paymentBffDisabled(method = 'POST') {
  return NextResponse.json(
    {
      error: true,
      success: false,
      message:
        'Этот payment endpoint отключён по соображениям безопасности. Оплата только через /api/order/payment/yookassa/*.',
      code: 'PAYMENT_BFF_DISABLED',
      method,
    },
    { status: 410 },
  );
}
