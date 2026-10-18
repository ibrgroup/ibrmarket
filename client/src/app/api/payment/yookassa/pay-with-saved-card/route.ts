import { paymentBffDisabled } from '../_disabled';

/** @deprecated Unauthenticated charge of saved card — disabled */
export async function POST() {
  return paymentBffDisabled('POST');
}
