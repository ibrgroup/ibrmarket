/**
 * Примеры использования PhoneInput с React Hook Form
 *
 * Этот файл содержит примеры интеграции PhoneInput с различными подходами RHF.
 * Используйте эти примеры как reference для ваших форм.
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { PhoneInput } from './phone-input';

// ============================================================
// Пример 1: Controller (идеальный вариант для shadcn/ui форм)
// ============================================================

const formSchema1 = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
});

type FormData1 = z.infer<typeof formSchema1>;

export function PhoneInputExample1() {
  const form = useForm<FormData1>({
    resolver: zodResolver(formSchema1),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = (data: FormData1) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Телефон</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  id="phone"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Отправить</Button>
      </form>
    </Form>
  );
}

// ============================================================
// Пример 2: setValue + watch (простой вариант)
// ============================================================

const formSchema2 = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
});

type FormData2 = z.infer<typeof formSchema2>;

export function PhoneInputExample2() {
  const {
    watch,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData2>({
    resolver: zodResolver(formSchema2),
    defaultValues: {
      phone: '',
    },
  });

  const phoneValue = watch('phone');

  const onSubmit = (data: FormData2) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="phone-2">Телефон</label>
        <PhoneInput
          id="phone-2"
          value={phoneValue || ''}
          onChange={(value) =>
            setValue('phone', value, {
              shouldValidate: true,
              shouldTouch: true,
            })
          }
          error={!!errors.phone}
          errorMessage={errors.phone?.message}
        />
      </div>
      <Button type="submit">Отправить</Button>
    </form>
  );
}

// ============================================================
// Пример 3: Controller с дополнительными пропсами
// ============================================================

const formSchema3 = z.object({
  phone: z.string().min(1, 'Введите номер телефона'),
  country: z.string().optional(),
});

type FormData3 = z.infer<typeof formSchema3>;

export function PhoneInputExample3() {
  const form = useForm<FormData3>({
    resolver: zodResolver(formSchema3),
    defaultValues: {
      phone: '',
      country: 'ru',
    },
  });

  // const country = form.watch('country');

  const onSubmit = (data: FormData3) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Телефон</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                  errorMessage={fieldState.error?.message}
                  id="phone-3"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Отправить</Button>
      </form>
    </Form>
  );
}
