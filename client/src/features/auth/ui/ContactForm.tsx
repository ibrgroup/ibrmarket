'use client';

// Нормализация контакта перенесена в auth-service (бизнес-логика не в UI)
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { PhoneInput } from '@/shared/ui/phone-input';
import { Mail, Phone } from 'lucide-react';
import type { Path, PathValue } from 'react-hook-form';
import { UseFormReturn } from 'react-hook-form';

export interface ContactFormData {
  method: 'phone' | 'email';
  contact: string;
}

interface ContactFormProps<T extends ContactFormData = ContactFormData> {
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  /**
   * Показывать поле имени (для регистрации)
   * Поле должно быть зарегистрировано в форме через RHF
   */
  showNameField?: boolean;
  disableSubmit?: boolean;
  autoComplete?: string;
  /**
   * Если false, компонент рендерится как div вместо form (для использования внутри другой формы)
   * @default true
   */
  renderAsForm?: boolean;
  /**
   * Текст кнопки submit
   * @default 'Получить код'
   */
  submitButtonText?: string;
}

/**
 * Компонент формы ввода контакта (телефон/email)
 */
export function ContactForm<T extends ContactFormData = ContactFormData>({
  form,
  onSubmit,
  isLoading = false,
  error,
  showNameField = false,
  disableSubmit = false,
  autoComplete = 'off',
  renderAsForm = true,
  submitButtonText = 'Получить код',
}: ContactFormProps<T>) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    watch,
    setValue,
  } = form;

  // Helper для безопасного получения значений полей с generic типом
  const getFieldValue = <K extends keyof ContactFormData>(field: K): ContactFormData[K] => {
    return watch(field as unknown as Path<T>) as PathValue<T, Path<T>> as ContactFormData[K];
  };

  const method = getFieldValue('method');
  const contact = getFieldValue('contact');
  const contactErrorMessage = (errors.contact as { message?: string } | undefined)?.message;
  // Показываем ошибку только если поле было touched (пользователь взаимодействовал с ним)
  const isContactTouched = touchedFields.contact;
  const hasContactError = Boolean(errors.contact && isContactTouched);

  const handleFormSubmit = async (data: T) => {
    await onSubmit(data);
  };

  // Обработчик для кнопки, когда форма не используется
  const handleButtonClick = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;
    const data = form.getValues();
    await handleFormSubmit(data);
  };

  const FormWrapper = renderAsForm ? 'form' : 'div';
  const formProps = renderAsForm
    ? {
        onSubmit: handleSubmit(handleFormSubmit),
        autoComplete,
      }
    : {};

  return (
    <FormWrapper className="space-y-5" {...formProps}>
      {/* Показываем serverError только если нет ошибок валидации полей */}
      {error && !hasContactError && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Поле имени (только для регистрации) */}
      {showNameField && (
        <div className="space-y-2">
          <Label htmlFor="name">Ваше имя</Label>
          <Input
            id="name"
            type="text"
            placeholder="Введите свое имя"
            autoComplete="name"
            {...register('name' as unknown as Path<T>)}
            disabled={isSubmitting || isLoading}
            required
          />
          {(() => {
            // Безопасная проверка ошибки для поля name (может быть в расширенном типе T)
            const nameError =
              'name' in errors && errors.name
                ? (errors.name as { message?: string } | undefined)
                : null;
            return nameError ? <p className="text-xs text-red-500">{nameError.message}</p> : null;
          })()}
        </div>
      )}

      {/* Выбор метода */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={method === 'phone' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => {
            setValue('method' as Path<T>, 'phone' as PathValue<T, Path<T>>, {
              shouldValidate: false,
            });
            // Полностью очищаем контакт при смене метода
            form.resetField('contact' as unknown as Path<T>, {
              defaultValue: '' as PathValue<T, Path<T>>,
              keepError: false,
              keepTouched: false,
              keepDirty: false,
            });
            form.clearErrors('contact' as unknown as Path<T>);
          }}
          disabled={disableSubmit}
        >
          <Phone className="mr-2 h-4 w-4" />
          Телефон
        </Button>
        <Button
          type="button"
          variant={method === 'email' ? 'default' : 'outline'}
          className="flex-1"
          onClick={() => {
            setValue('method' as Path<T>, 'email' as PathValue<T, Path<T>>, {
              shouldValidate: false,
            });
            // Полностью очищаем контакт при смене метода
            form.resetField('contact' as unknown as Path<T>, {
              defaultValue: '' as PathValue<T, Path<T>>,
              keepError: false,
              keepTouched: false,
              keepDirty: false,
            });
            form.clearErrors('contact' as unknown as Path<T>);
          }}
          disabled={disableSubmit}
        >
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
      </div>

      {/* Ввод контакта */}
      <div className="space-y-2">
        <Label htmlFor="contact">{method === 'email' ? 'Email адрес' : 'Номер телефона'}</Label>
        {method === 'email' ? (
          <>
            <Input
              id="contact"
              type="email"
              placeholder="Введите свой email"
              {...register('contact' as unknown as Path<T>)}
              disabled={isSubmitting || isLoading}
              className={hasContactError ? 'border-red-500' : ''}
            />
            {hasContactError && contactErrorMessage && (
              <p className="text-xs text-red-500">{contactErrorMessage}</p>
            )}
          </>
        ) : (
          <PhoneInput
            id="contact"
            placeholder="Введите свой номер телефона"
            value={contact}
            onChange={(phone) => {
              // Не валидируем на каждое изменение для избежания лагов
              // Валидация произойдет при blur или submit
              setValue('contact' as Path<T>, phone as PathValue<T, Path<T>>, {
                shouldValidate: false,
                shouldTouch: true,
              });
            }}
            onBlur={() => {
              // Валидация при потере фокуса
              form.trigger('contact' as unknown as Path<T>);
            }}
            disabled={isSubmitting || isLoading}
            error={hasContactError}
            errorMessage={hasContactError ? contactErrorMessage : undefined}
          />
        )}
      </div>

      <Button
        type={renderAsForm ? 'submit' : 'button'}
        className="w-full"
        disabled={isSubmitting || isLoading || disableSubmit}
        onClick={renderAsForm ? undefined : handleButtonClick}
        aria-busy={isSubmitting || isLoading}
      >
        {isSubmitting || isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Отправка...
          </span>
        ) : (
          submitButtonText
        )}
      </Button>
    </FormWrapper>
  );
}
