'use client';

import { useAddresses } from '@/entities/address';
import type { Address } from '@/entities/user';
import { useUserStore } from '@/entities/user';
import { useAuthModal } from '@/features/auth-modal';
import { addressService } from '@/shared/api/services';
import { mergeAddressLine, type DadataStructuredAddress } from '@/shared/lib/dadata-address';
import { cn } from '@/shared/lib/utils';
import { AddressInput } from '@/shared/ui/address-input';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PhoneInput } from '@/shared/ui/phone-input';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useAddressFormModalStore } from '../model/address-form-modal.store';

function newIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `addr-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type FormState = {
  street: string;
  apartmentLine: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  mobile: string;
  landmark: string;
  isDefault: boolean;
};

const emptyForm = (isDefault = false): FormState => ({
  street: '',
  apartmentLine: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Россия',
  mobile: '',
  landmark: '',
  isDefault,
});

export function AddressFormModal() {
  const isOpen = useAddressFormModalStore((s) => s.isOpen);
  const editId = useAddressFormModalStore((s) => s.editId);
  const preferDefault = useAddressFormModalStore((s) => s.preferDefault);
  const openEpoch = useAddressFormModalStore((s) => s.openEpoch);
  const close = useAddressFormModalStore((s) => s.close);
  const clearCallbacks = useAddressFormModalStore((s) => s.clearCallbacks);

  const queryClient = useQueryClient();
  const user = useUserStore((state) => state.user);
  const { openAuthModal } = useAuthModal();
  const isEditMode = Boolean(editId);
  const { isAtLimit, maxAddresses } = useAddresses(Boolean(user?._id && isOpen && !editId));

  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const createIdempotencyKeyRef = useRef(newIdempotencyKey());
  const [phoneValue, setPhoneValue] = useState('');
  const [formData, setFormData] = useState<FormState>(() => emptyForm());

  const applyParsed = useCallback((parsed: DadataStructuredAddress | null) => {
    if (!parsed) return;
    setFormData((prev) => ({
      ...prev,
      street: parsed.address_line1,
      city: parsed.city,
      state: parsed.state,
      zipCode: parsed.pincode,
      country: parsed.country || 'Россия',
    }));
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      // колбэки чистим после закрытия анимации — иначе onSuccess уже вызван
      window.setTimeout(() => clearCallbacks(), 200);
    }
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const hydrate = async () => {
      if (editId) {
        setIsHydrating(true);
        setIsLoading(true);
        try {
          const { address } = await addressService.getAddress(editId);
          if (cancelled) return;
          const mobile = address.mobile ? String(address.mobile) : '';
          setFormData({
            street: address.address_line1 || '',
            apartmentLine: '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.pincode || '',
            country: address.country || 'Россия',
            mobile,
            landmark: address.landmark || '',
            isDefault: address.selected || false,
          });
          setPhoneValue(mobile);
        } catch {
          if (!cancelled) {
            toast.error('Не удалось загрузить адрес для редактирования');
            close();
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
            setIsHydrating(false);
          }
        }
        return;
      }

      createIdempotencyKeyRef.current = newIdempotencyKey();
      const phone = user?.phone ? String(user.phone) : '';
      setFormData(emptyForm(preferDefault));
      setPhoneValue(phone);
      setIsHydrating(false);
      setIsLoading(false);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [isOpen, editId, openEpoch, preferDefault, user?.phone, close]);

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isHydrating) return;
    setIsLoading(true);

    try {
      if (!user?._id) {
        toast.error('Необходимо войти в аккаунт');
        openAuthModal({ type: 'profile' });
        return;
      }

      const streetTrim = formData.street?.trim() || '';
      if (!streetTrim) {
        toast.error('Укажите адрес — начните вводить и выберите подсказку');
        return;
      }
      if (!formData.city?.trim()) {
        toast.error('Не удалось определить город — выберите адрес из списка подсказок');
        return;
      }
      if (!formData.state?.trim()) {
        toast.error('Не удалось определить регион — выберите адрес из списка подсказок');
        return;
      }
      if (!formData.zipCode?.trim() || !/^\d{5,6}$/.test(formData.zipCode.trim())) {
        toast.error('Нужен почтовый индекс — выберите адрес из подсказок до дома');
        return;
      }
      if (!formData.country?.trim()) {
        toast.error('Укажите страну');
        return;
      }

      const phone = phoneValue || formData.mobile;
      const mobileDigits = phone ? phone.replace(/\D/g, '') : '';
      if (!mobileDigits || mobileDigits.length < 11) {
        toast.error('Укажите корректный номер телефона');
        return;
      }

      const line1 = mergeAddressLine(streetTrim, formData.apartmentLine?.trim());
      const addressData = {
        address_line1: line1,
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.zipCode.trim(),
        country: formData.country.trim(),
        mobile: mobileDigits,
        landmark: formData.landmark?.trim() || undefined,
        selected: formData.isDefault || preferDefault,
        name: user.name?.trim() || undefined,
        locality: formData.city.trim(),
        addressType: 'HOME' as const,
      };

      let saved: Address;

      if (isEditMode && editId) {
        const { address } = await addressService.updateAddress(editId, addressData);
        saved = address;
        toast.success('Адрес успешно обновлён');
      } else {
        if (isAtLimit) {
          toast.error(
            `Достигнут лимит адресов (${maxAddresses}). Удалите ненужный адрес в разделе «Мои адреса».`,
          );
          return;
        }
        const { address } = await addressService.addAddress(addressData, {
          idempotencyKey: createIdempotencyKeyRef.current,
        });
        saved = address;
        createIdempotencyKeyRef.current = newIdempotencyKey();

        if ((formData.isDefault || preferDefault) && saved._id && !saved.selected) {
          try {
            await addressService.setDefaultAddress(saved._id);
            saved = { ...saved, selected: true };
          } catch {
            // адрес уже создан — выбор по умолчанию не блокирует успех
          }
        }
        toast.success('Адрес успешно добавлен');
      }

      await queryClient.invalidateQueries({ queryKey: ['addresses'] });

      const onSuccess = useAddressFormModalStore.getState().onSuccess;
      onSuccess?.(saved);
      clearCallbacks();
      close();
    } catch (error) {
      console.error('[AddressFormModal] Error saving address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при сохранении адреса';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const hasStructuredMeta = Boolean(formData.city && formData.zipCode);
  const busy = isLoading || isHydrating;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          'flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0',
          'max-sm:!fixed max-sm:!bottom-0 max-sm:!left-0 max-sm:!right-0',
          'max-sm:!top-auto max-sm:!h-auto max-sm:!max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))]',
          'max-sm:!w-full max-sm:!max-w-full',
          'max-sm:!translate-x-0 max-sm:!translate-y-0',
          'max-sm:!rounded-t-3xl max-sm:!rounded-b-none',
        )}
      >
        <div className="shrink-0 space-y-1 border-b border-border px-5 pb-3 pt-5 pr-12">
          <DialogTitle className="flex items-center gap-2 font-roboto text-xl font-bold">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            {isEditMode ? 'Редактировать адрес' : 'Новый адрес доставки'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEditMode
              ? 'При смене улицы выберите подсказку — подставятся город и индекс.'
              : isAtLimit
                ? `Достигнут лимит: не более ${maxAddresses} адресов.`
                : 'Введите адрес и выберите вариант из списка — поля заполнятся сами.'}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="address-form-autocomplete">Адрес</Label>
              <AddressInput
                id="address-form-autocomplete"
                value={formData.street}
                onChange={(v) => handleChange('street', v)}
                onParsedAddress={applyParsed}
                disabled={busy}
                className="bg-gray-100 dark:bg-gray-100"
              />
              {hasStructuredMeta && (
                <p className="text-xs text-muted-foreground">
                  {formData.city}
                  {formData.zipCode ? ` · ${formData.zipCode}` : ''}
                  {formData.country ? ` · ${formData.country}` : ''}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address-form-apartment">Квартира, подъезд, домофон</Label>
              <Input
                id="address-form-apartment"
                value={formData.apartmentLine}
                onChange={(e) => handleChange('apartmentLine', e.target.value)}
                placeholder="кв. 12, 2 подъезд, код 1234"
                disabled={busy}
                className="h-12 rounded-2xl bg-gray-100 dark:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address-form-mobile">Телефон</Label>
              <PhoneInput
                id="address-form-mobile"
                value={phoneValue}
                onChange={(phone) => {
                  setPhoneValue(phone);
                  handleChange('mobile', phone);
                }}
                disabled={busy}
                placeholder="+7 (999) 123-45-67"
                className="h-12 rounded-2xl border-none bg-gray-100 shadow-none dark:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address-form-landmark">Ориентир (необязательно)</Label>
              <Input
                id="address-form-landmark"
                value={formData.landmark}
                onChange={(e) => handleChange('landmark', e.target.value)}
                placeholder="Рядом с магазином"
                disabled={busy}
                className="h-12 rounded-2xl bg-gray-100 dark:bg-gray-100"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="address-form-default"
                checked={formData.isDefault || preferDefault}
                disabled={busy || preferDefault}
                onCheckedChange={(checked) => handleChange('isDefault', checked === true)}
              />
              <Label htmlFor="address-form-default" className="text-sm">
                Сделать адресом по умолчанию
              </Label>
            </div>
          </div>

          <div className="shrink-0 flex gap-3 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-2xl"
              disabled={busy}
              onClick={() => handleOpenChange(false)}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={busy || (!isEditMode && isAtLimit)}
              className="h-12 flex-1 rounded-2xl"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isHydrating ? 'Загрузка…' : 'Сохранение…'}
                </>
              ) : isEditMode ? (
                'Обновить'
              ) : isAtLimit ? (
                `Лимит (${maxAddresses})`
              ) : (
                'Сохранить'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
