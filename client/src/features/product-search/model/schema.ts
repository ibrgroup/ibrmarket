import { z } from 'zod';

/**
 * Схема валидации поискового запроса
 */
export const searchSchema = z.object({
  query: z.string().trim().max(100, 'Поисковый запрос слишком длинный'),
});

export type SearchFormData = z.infer<typeof searchSchema>;

