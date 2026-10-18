import { apiClient } from '../client';
import type { User } from '@/entities/user';

class UserService {
  private readonly endpoints = {
    me: '/api/user/user-details',
    updateProfile: '/api/user',
    updateAvatar: '/api/user/user-avatar',
  } as const;

  async getProfile(): Promise<User> {
    console.log('📥 [UserService] Fetching profile from:', this.endpoints.me);
    const response = await apiClient.get(this.endpoints.me);
    console.log('📥 [UserService] Raw response:', response);

    // CRITICAL: Check if response is an error (401, etc.)
    // If apiClient returns error object, throw it properly
    if (response && typeof response === 'object' && 'error' in response && response.error === true) {
      const errorMessage = 'message' in response ? (response.message as string) : 'Unauthorized';
      const error = new Error(errorMessage);
      (error as any).status = 401;
      throw error;
    }

    // Backend может возвращать под разными структурами
    let user: User | null = null;
    if (response && typeof response === 'object') {
      if ('data' in response && response.data && typeof response.data === 'object') {
        // Check if data contains error
        if ('error' in response.data && response.data.error === true) {
          const errorMessage =
            'message' in response.data ? (response.data.message as string) : 'Unauthorized';
          const error = new Error(errorMessage);
          (error as any).status = 401;
          throw error;
        }
        if ('user' in response.data && response.data.user) {
          user = response.data.user as User;
        } else {
          user = response.data as User;
        }
      } else if ('user' in response && response.user) {
        user = response.user as User;
      }
    }

    if (!user) {
      // If no user found and response is not an error object, try to use response as user
      // But if response looks like error, throw instead
      if (response && typeof response === 'object' && 'error' in response) {
        const errorMessage = 'message' in response ? (response.message as string) : 'Unauthorized';
        const error = new Error(errorMessage);
        (error as any).status = 401;
        throw error;
      }
      user = response as User;
    }

    // Normalize backend shape -> frontend User
    const normalizeUser = (u: any) => {
      if (!u) return u;
      const phone =
        u.phone ?? (u.mobile !== undefined && u.mobile !== null ? String(u.mobile) : undefined);

      let address = u.address ?? undefined;
      if (!address && Array.isArray(u.address_details) && u.address_details.length > 0) {
        const sel = u.address_details.find((a: any) => a.selected) || u.address_details[0];
        if (sel) {
          const parts = [sel.address_line1, sel.city, sel.state, sel.pincode, sel.country].filter(
            Boolean,
          );
          address = parts.join(', ');
        }
      }

      return {
        ...u,
        phone,
        address,
      } as User;
    };

    const normalized = normalizeUser(user as any) as User;

    console.log('✅ [UserService] Extracted user profile:', {
      _id: normalized?._id,
      name: normalized?.name,
      email: normalized?.email,
      phone: normalized?.phone,
      address: normalized?.address,
      hasPhone: !!normalized?.phone,
      hasAddress: !!normalized?.address,
    });

    return normalized;
  }

  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'name' | 'email' | 'phone' | 'address'>>,
  ): Promise<User> {
    console.log('📤 [UserService] Sending update request:', { userId, data });
    const response = await apiClient.put(`${this.endpoints.updateProfile}/${userId}`, data);
    console.log('📥 [UserService] Received response:', response);

    // Backend может возвращать под разными структурами
    let user: User | null = null;
    if (response && typeof response === 'object') {
      if ('data' in response && response.data && typeof response.data === 'object') {
        if ('user' in response.data && response.data.user) {
          user = response.data.user as User;
        } else {
          user = response.data as User;
        }
      } else if ('user' in response && response.user) {
        user = response.user as User;
      }
    }

    if (!user) {
      user = response as User;
    }

    // Normalize backend -> frontend
    const normalizeUser = (u: any) => {
      if (!u) return u;
      const phone =
        u.phone ?? (u.mobile !== undefined && u.mobile !== null ? String(u.mobile) : undefined);

      let address = u.address ?? undefined;
      if (!address && Array.isArray(u.address_details) && u.address_details.length > 0) {
        const sel = u.address_details.find((a: any) => a.selected) || u.address_details[0];
        if (sel) {
          const parts = [sel.address_line1, sel.city, sel.state, sel.pincode, sel.country].filter(
            Boolean,
          );
          address = parts.join(', ');
        }
      }

      return {
        ...u,
        phone,
        address,
      } as User;
    };

    const normalized = normalizeUser(user as any) as User;

    console.log('✅ [UserService] Extracted user:', {
      phone: normalized?.phone,
      address: normalized?.address,
      fullUser: normalized,
    });

    return normalized;
  }

  async updateAvatar(formData: FormData): Promise<{ avatar: string }> {
    const response = await apiClient.put(this.endpoints.updateAvatar, formData);
    // Backend может возвращать под разными структурами
    if (response && typeof response === 'object') {
      if ('data' in response && response.data && typeof response.data === 'object') {
        return response.data as { avatar: string };
      }
    }
    return response as { avatar: string };
  }
}

export const userService = new UserService();
