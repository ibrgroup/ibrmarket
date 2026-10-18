import { apiClient } from '../client';

export interface Banner {
  _id: string;
  bannerTitle: string;
  images: string[];
  catId?: string;
  subCatId?: string;
  thirdsubCatId?: string;
  price?: number;
  alignInfo?: string;
}

export type BannerPayload = {
  bannerTitle: string;
  images: string[];
  catId?: string;
  subCatId?: string;
  thirdsubCatId?: string;
  price: number;
  alignInfo: string;
};

type BannersListResponse = {
  data?: Banner[];
  error?: boolean;
  success?: boolean;
  message?: string;
};

type BannerOneResponse = {
  banner?: Banner;
  error?: boolean;
  success?: boolean;
  message?: string;
};

class BannerService {
  private readonly endpoints = {
    getBanners: '/api/bannerV1/',
    getBanner: '/api/bannerV1',
    add: '/api/bannerV1/add',
    uploadImages: '/api/bannerV1/uploadImages',
  };

  async getBanners(): Promise<{ banners: Banner[] }> {
    const response = await apiClient.get<BannersListResponse>(this.endpoints.getBanners);
    const raw = response as BannersListResponse;

    if (raw.success === false || raw.error === true) {
      throw new Error(raw.message || 'Ошибка при получении баннеров');
    }

    return { banners: Array.isArray(raw.data) ? raw.data : [] };
  }

  async getBanner(id: string): Promise<{ banner: Banner }> {
    const response = await apiClient.get<BannerOneResponse>(`${this.endpoints.getBanner}/${id}`);
    const raw = response as BannerOneResponse;

    if (raw.success === false || !raw.banner) {
      throw new Error(raw.message || 'Баннер не найден');
    }

    return { banner: raw.banner };
  }

  private extractBanner(raw: BannerOneResponse & { data?: Banner }): Banner | null {
    if (raw.banner && typeof raw.banner === 'object') return raw.banner;
    if (raw.data && typeof raw.data === 'object' && (raw.data._id || (raw.data as Banner & { id?: string }).id)) {
      return raw.data;
    }
    return null;
  }

  async createBanner(payload: BannerPayload): Promise<Banner> {
    const response = await apiClient.post<BannerOneResponse>(this.endpoints.add, payload);
    const raw = response as BannerOneResponse & { data?: Banner };
    if (raw.success === false) {
      throw new Error(raw.message || 'Не удалось создать баннер');
    }
    const banner = this.extractBanner(raw);
    if (!banner) {
      throw new Error(raw.message || 'Не удалось создать баннер');
    }
    return banner;
  }

  async updateBanner(id: string, payload: Partial<BannerPayload>): Promise<Banner> {
    const response = await apiClient.put<BannerOneResponse>(
      `${this.endpoints.getBanner}/${id}`,
      payload,
    );
    const raw = response as BannerOneResponse & { data?: Banner };
    if (raw.success === false) {
      throw new Error(raw.message || 'Не удалось обновить баннер');
    }
    const banner = this.extractBanner(raw);
    if (!banner) {
      throw new Error(raw.message || 'Не удалось обновить баннер');
    }
    return banner;
  }

  async deleteBanner(id: string): Promise<void> {
    const response = await apiClient.delete<{
      error?: boolean;
      success?: boolean;
      message?: string;
    }>(`${this.endpoints.getBanner}/${id}`);
    const raw = response as { error?: boolean; success?: boolean; message?: string };
    if (raw.success === false || raw.error === true) {
      throw new Error(raw.message || 'Не удалось удалить баннер');
    }
  }

  async uploadImages(files: File[]): Promise<string[]> {
    if (!files.length) return [];
    const fd = new FormData();
    for (const f of files) {
      fd.append('images', f);
    }
    const res = await apiClient.post<{ images?: string[]; success?: boolean; message?: string }>(
      this.endpoints.uploadImages,
      fd,
    );
    const raw = res as { images?: string[]; success?: boolean; message?: string };
    if (raw.success === false) {
      throw new Error(raw.message || 'Ошибка загрузки изображений');
    }
    const images = raw.images;
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Сервер не вернул URL изображений');
    }
    return images;
  }
}

export const bannerService = new BannerService();
