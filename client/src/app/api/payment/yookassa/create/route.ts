import { paymentBffDisabled } from '../_disabled';

/** @deprecated Unauthenticated YooKassa create — disabled */
export async function POST() {
  return paymentBffDisabled('POST');
}
