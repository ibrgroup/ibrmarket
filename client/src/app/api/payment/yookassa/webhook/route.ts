import { paymentBffDisabled } from '../_disabled';

/**
 * @deprecated Shadow Next webhook — disabled.
 * Configure YooKassa cabinet to hit Express/Nest: POST /api/payment/yookassa/webhook
 */
export async function POST() {
  return paymentBffDisabled('POST');
}
