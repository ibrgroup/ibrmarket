import { paymentBffDisabled } from '../_disabled';

/** @deprecated Unauthenticated save-card — disabled */
export async function POST() {
  return paymentBffDisabled('POST');
}
