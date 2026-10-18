import { paymentBffDisabled } from '../../_disabled';

/** @deprecated Unauthenticated payment status leak — disabled */
export async function GET() {
  return paymentBffDisabled('GET');
}
