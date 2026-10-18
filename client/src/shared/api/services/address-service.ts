import type { Address } from '@/entities/user';
import { useUserStore } from '@/entities/user';
import { apiClient } from '../client';

/** Nest CreateAddressDto.addressType */
export type NestAddressType = 'HOME' | 'OFFICE';

/**
 * Поля, которыми оперирует UI (legacy / удобный формат).
 * В Nest уходит другая схема — см. toNestCreateBody / toNestUpdateBody.
 */
export interface AddAddressRequest {
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: number | string;
  landmark?: string;
  /** → isDefault на Nest */
  selected?: boolean;
  /** Имя получателя; иначе имя из профиля */
  name?: string;
  /** Район / населённый пункт; иначе city */
  locality?: string;
  addressType?: NestAddressType;
}

export interface UpdateAddressRequest {
  address_line1?: string;
  city?: string;
  pincode?: string;
  country?: string;
  mobile?: string | number;
  landmark?: string;
  state?: string;
  selected?: boolean;
  name?: string;
  locality?: string;
  addressType?: NestAddressType;
}

/** Сырой адрес из Nest (Prisma) */
type NestAddressRaw = {
  id?: string;
  _id?: string;
  userId?: string;
  name?: string;
  mobile?: string | number | null;
  pincode?: string;
  locality?: string;
  address?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  country?: string;
  landmark?: string | null;
  addressType?: NestAddressType | string;
  isDefault?: boolean;
  selected?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeMobileDigits(mobile: number | string): string {
  return String(mobile ?? '').replace(/\D/g, '');
}

function toNestCreateBody(data: AddAddressRequest) {
  const user = useUserStore.getState().user;
  const mobile = normalizeMobileDigits(data.mobile);
  const city = data.city.trim();

  return {
    name: (data.name?.trim() || user?.name?.trim() || 'Получатель').slice(0, 100),
    mobile,
    pincode: data.pincode.trim(),
    locality: (data.locality?.trim() || city).slice(0, 100),
    address: data.address_line1.trim().slice(0, 200),
    city: city.slice(0, 100),
    state: data.state.trim().slice(0, 100),
    country: data.country.trim().slice(0, 100),
    ...(data.landmark?.trim() ? { landmark: data.landmark.trim().slice(0, 200) } : {}),
    addressType: data.addressType ?? ('HOME' as NestAddressType),
    isDefault: Boolean(data.selected),
  };
}

function toNestUpdateBody(data: UpdateAddressRequest) {
  const body: Record<string, unknown> = {};

  if (data.address_line1 !== undefined) body.address = data.address_line1.trim();
  if (data.city !== undefined) body.city = data.city.trim();
  if (data.state !== undefined) body.state = data.state.trim();
  if (data.pincode !== undefined) body.pincode = data.pincode.trim();
  if (data.country !== undefined) body.country = data.country.trim();
  if (data.mobile !== undefined) body.mobile = normalizeMobileDigits(data.mobile);
  if (data.landmark !== undefined) {
    const lm = data.landmark.trim();
    body.landmark = lm || undefined;
  }
  if (data.name !== undefined) body.name = data.name.trim();
  if (data.locality !== undefined) body.locality = data.locality.trim();
  if (data.addressType !== undefined) body.addressType = data.addressType;
  if (data.selected !== undefined) body.isDefault = Boolean(data.selected);

  return body;
}

/** Nest / legacy → формат UI */
export function mapApiAddressToClient(raw: NestAddressRaw | null | undefined): Address | null {
  if (!raw || typeof raw !== 'object') return null;

  const id = String(raw._id ?? raw.id ?? '').trim();
  if (!id) return null;

  const address_line1 = String(raw.address_line1 ?? raw.address ?? '').trim();
  const mobileRaw = raw.mobile;
  let mobile: number | null = null;
  if (mobileRaw != null && mobileRaw !== '') {
    const digits = normalizeMobileDigits(mobileRaw);
    if (digits) {
      const n = Number(digits);
      mobile = Number.isFinite(n) ? n : null;
    }
  }

  return {
    _id: id,
    userId: String(raw.userId ?? ''),
    address_line1,
    city: String(raw.city ?? ''),
    state: raw.state != null ? String(raw.state) : undefined,
    pincode: String(raw.pincode ?? ''),
    country: String(raw.country ?? ''),
    mobile,
    selected: Boolean(raw.selected ?? raw.isDefault),
    landmark:
      raw.landmark != null && String(raw.landmark).trim() ? String(raw.landmark) : undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapAddressList(raw: unknown): Address[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => mapApiAddressToClient(item as NestAddressRaw))
    .filter((a): a is Address => a != null);
}

function extractErrorMessage(message: unknown, fallback: string): string {
  if (typeof message === 'string' && message.trim()) return message;
  if (Array.isArray(message)) {
    const parts = message.map((m) => String(m)).filter(Boolean);
    if (parts.length) return parts.join('; ');
  }
  return fallback;
}

class AddressService {
  private readonly endpoints = {
    getAddresses: '/api/address/get',
    getAddress: '/api/address',
    addAddress: '/api/address/add',
    updateAddress: '/api/address',
    deleteAddress: '/api/address',
  };

  async getAddresses(userId?: string): Promise<{
    addresses: Address[];
    total: number;
    maxAddresses: number;
  }> {
    let queryUserId = userId;
    if (!queryUserId && typeof window !== 'undefined') {
      const user = useUserStore.getState().user;
      queryUserId = user?._id || undefined;
    }

    if (!queryUserId) {
      throw new Error('Не удалось определить userId для получения адресов');
    }

    // Nest берёт userId из JWT; query оставляем для совместимости со старым API
    const url = `${this.endpoints.getAddresses}?userId=${encodeURIComponent(queryUserId)}`;

    const response = (await apiClient.get(url)) as unknown as {
      data?: unknown;
      error: boolean;
      success: boolean;
      message?: unknown;
    };

    if (response.success === false) {
      throw new Error(extractErrorMessage(response.message, 'Ошибка при получении адресов'));
    }

    const payload = response.data;
    // Nest: data = Address[]; legacy: data = { addresses, pagination, maxAddresses }
    let addresses: Address[] = [];
    let total = 0;
    let maxAddresses = 10;

    if (Array.isArray(payload)) {
      addresses = mapAddressList(payload);
      total = addresses.length;
    } else if (payload && typeof payload === 'object') {
      const obj = payload as {
        addresses?: unknown;
        pagination?: { total?: number };
        maxAddresses?: number;
      };
      addresses = mapAddressList(obj.addresses);
      total = obj.pagination?.total ?? addresses.length;
      maxAddresses = obj.maxAddresses ?? 10;
    }

    return { addresses, total, maxAddresses };
  }

  async getAddress(id: string): Promise<{ address: Address }> {
    const response = (await apiClient.get(`${this.endpoints.getAddress}/${id}`)) as unknown as {
      data: NestAddressRaw;
      error: boolean;
      success: boolean;
      message?: unknown;
    };

    const mapped = mapApiAddressToClient(response.data);
    if (response.success === false || !mapped) {
      throw new Error(extractErrorMessage(response.message, 'Адрес не найден'));
    }

    return { address: mapped };
  }

  async addAddress(
    data: AddAddressRequest,
    options?: { idempotencyKey?: string },
  ): Promise<{ address: Address }> {
    const body = toNestCreateBody(data);
    if (!body.mobile || body.mobile.length < 11) {
      throw new Error('Укажите корректный номер телефона');
    }

    const idempotencyKey = options?.idempotencyKey?.trim();
    const payload = {
      ...body,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };
    const headers = idempotencyKey ? { 'Idempotence-Key': idempotencyKey } : undefined;

    const response = (await apiClient.post(
      this.endpoints.addAddress,
      payload,
      headers,
    )) as unknown as {
      data: NestAddressRaw;
      error: boolean;
      success: boolean;
      message?: unknown;
      idempotent?: boolean;
    };

    const mapped = mapApiAddressToClient(response.data);
    if (!response.success || !mapped) {
      throw new Error(extractErrorMessage(response.message, 'Ошибка при добавлении адреса'));
    }

    return { address: mapped };
  }

  async updateAddress(id: string, data: UpdateAddressRequest): Promise<{ address: Address }> {
    const body = toNestUpdateBody(data);
    if (body.mobile != null && String(body.mobile).length > 0 && String(body.mobile).length < 11) {
      throw new Error('Укажите корректный номер телефона');
    }

    const response = (await apiClient.put(
      `${this.endpoints.updateAddress}/${id}`,
      body,
    )) as unknown as {
      data: NestAddressRaw;
      error: boolean;
      success: boolean;
      message?: unknown;
    };

    const mapped = mapApiAddressToClient(response.data);
    if (!response.success || !mapped) {
      throw new Error(extractErrorMessage(response.message, 'Ошибка при обновлении адреса'));
    }

    return { address: mapped };
  }

  async deleteAddress(id: string): Promise<{ message: string }> {
    const response = (await apiClient.delete(
      `${this.endpoints.deleteAddress}/${id}`,
    )) as unknown as {
      message: unknown;
      error: boolean;
      success: boolean;
      data?: unknown;
    };

    if (!response.success) {
      throw new Error(extractErrorMessage(response.message, 'Ошибка при удалении адреса'));
    }

    return { message: extractErrorMessage(response.message, 'Адрес удален') };
  }

  async setDefaultAddress(id: string): Promise<{ address: Address }> {
    return this.updateAddress(id, { selected: true });
  }
}

export const addressService = new AddressService();
