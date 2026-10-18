'use client';

import { ChangeEvent, useLayoutEffect, useRef, useState, useTransition } from 'react';
// Импорты из вашего проекта
import type { User } from '@/entities/user';
import { useAuth, useUserStore } from '@/features/auth';
import { useToast } from '@/shared/hooks/use-toast';
import { validateEmail, validatePhone, validateRequired } from '@/shared/lib/validation';
import { cn } from '@/shared/lib/utils';
import { AddressInput } from '@/shared/ui/address-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PhoneInput } from '@/shared/ui/phone-input';
import { Camera, Loader2, Save, X } from 'lucide-react';

export interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileForm {
  name: string;
  email: string;
  phone: string; // Это поле синхронизируется с phoneValue
  address: string;
}

function getDefaultForm(user: User | null): ProfileForm {
  return {
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  };
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user } = useAuth();
  const { updateProfile, updateAvatar, isLoading, error } = useUserStore();
  const { showSuccess, showError } = useToast();

  // --- Состояния формы ---
  const [profileForm, setProfileForm] = useState<ProfileForm>(getDefaultForm(user ?? null));
  const [phoneValue, setPhoneValue] = useState<string>(user?.phone || '');
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  // Сброс состояния при открытии модалки
  useLayoutEffect(() => {
    if (open && user) {
      const defaultForm = getDefaultForm(user);
      setProfileForm(defaultForm);
      setPhoneValue(user.phone || '');
      setAvatarPreview(null);
      setAvatarFile(null);
      setFormErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, user]);

  const handleChange = (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm((prev) => ({ ...prev, [field]: e.target.value }));
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    try {
      await updateAvatar(avatarFile);
      showSuccess('Аватар успешно обновлен');
      setAvatarFile(null);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при обновлении аватара';
      showError(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    const nameValidation = validateRequired(profileForm.name, 'Имя');
    if (!nameValidation.isValid) errors.name = nameValidation.errors;

    const emailValidation = validateEmail(profileForm.email);
    if (!emailValidation.isValid) errors.email = emailValidation.errors;

    if (phoneValue) {
      const phoneValidation = validatePhone(phoneValue);
      if (!phoneValidation.isValid) errors.phone = phoneValidation.errors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileUpdate = async () => {
    if (!validateForm()) return;

    try {
      // Сначала обновляем аватар, если он выбран
      if (avatarFile) {
        await updateAvatar(avatarFile);
        showSuccess('Профиль и аватар успешно обновлены');
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
        phone: phoneValue || '',
        address: profileForm.address || '',
      };

      await updateProfile(updateData);
      showSuccess('Профиль успешно обновлен');
      onOpenChange(false); // Закрываем модальное окно после успешного сохранения
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при обновлении профиля';
      showError(message);
    }
  };

  // Заглушка для menuItems, чтобы пример работал без ошибок
  // const menuItems = [
  //   { value: 'tab1', label: 'Вкладка 1', icon: () => <div className="h-4 w-4 bg-blue-300" /> },
  //   { value: 'tab2', label: 'Вкладка 2', icon: () => <div className="h-4 w-4 bg-green-300" /> },
  //   { value: 'tab3', label: 'Вкладка 3', icon: () => <div className="h-4 w-4 bg-red-300" /> },
  // ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[calc(100dvh-2rem)] w-full max-w-2xl space-y-6 overflow-y-auto p-6 sm:p-8',
          // Mobile: bottom sheet по высоте контента
          'max-sm:!fixed max-sm:!bottom-0 max-sm:!left-0 max-sm:!right-0',
          'max-sm:!top-auto max-sm:!h-auto max-sm:!max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))]',
          'max-sm:!w-full max-sm:!max-w-full',
          'max-sm:!translate-x-0 max-sm:!translate-y-0',
          'max-sm:!rounded-t-4xl max-sm:!rounded-b-none',
        )}
      >
        {/* Блок "Аватар" */}

        {/* Блок "Личная информация" */}
        <div className="space-y-4">
          <div className="space-y-4">
            <h3 className="mb-2 text-xl font-bold font-roboto">Аватар</h3>
            <p className="mb-4 text-xs text-gray-800">Загрузите фото профиля</p>

            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {avatarPreview || user?.avatar ? (
                  <AvatarImage
                    src={avatarPreview || user?.avatar || ''}
                    alt={user?.name || 'Аватар'}
                  />
                ) : (
                  <AvatarFallback className="text-xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                  Изменить аватар
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {avatarFile && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      type="button"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      Отмена
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAvatarUpload}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                      type="button"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isLoading ? 'Загрузка...' : 'Сохранить'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-bold font-roboto">Личная информация</h3>
            <p className="mb-4 text-xs text-gray-800">Обновите свои личные данные</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name">Имя</Label>
              <Input
                id="modal-name"
                value={profileForm.name}
                onChange={handleChange('name')}
                placeholder="Введите имя"
                autoComplete="off"
                className="bg-gray-100 dark:bg-gray-100 py-6 rounded-xl"
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email">Email</Label>
              <Input
                id="modal-email"
                type="email"
                value={profileForm.email}
                onChange={handleChange('email')}
                placeholder="Введите email"
                autoComplete="off"
                className="bg-gray-100 dark:bg-gray-100 py-6 rounded-xl"
              />
              {formErrors.email && <p className="text-sm text-red-500">{formErrors.email[0]}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="modal-phone">Мобильный телефон</Label>
              <PhoneInput
                id="modal-phone"
                value={phoneValue}
                onChange={setPhoneValue}
                disabled={isLoading}
                placeholder="+7 (999) 123-45-67"
                error={!!formErrors.phone}
                errorMessage={formErrors.phone?.[0]}
                className="bg-gray-100 py-6 dark:bg-gray-100 border-none shadow-none rounded-xl"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="modal-address">Адрес</Label>
              <AddressInput
                id="modal-address"
                value={profileForm.address}
                onChange={(address) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    address,
                  }))
                }
                placeholder="Введите адрес"
                className="bg-gray-100 py-6 dark:bg-gray-100 border-none shadow-none rounded-xl"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              type="button"
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={() => startTransition(handleProfileUpdate)}
              disabled={isLoading || (Object.keys(formErrors).length > 0 && !validateForm())}
              className="flex items-center gap-2"
              type="button"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
