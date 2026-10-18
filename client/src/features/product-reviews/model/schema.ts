import { z } from 'zod';

/**
 * Zod схема для валидации формы отзыва
 */
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Минимальная оценка — 1 звезда')
    .max(5, 'Максимальная оценка — 5 звезд')
    .int('Оценка должна быть целым числом'),

  review: z
    .string()
    .min(10, 'Минимальная длина отзыва — 10 символов')
    .max(2000, 'Максимальная длина отзыва — 2000 символов')
    .trim(),

  image: z.string().url('Неверный формат URL изображения').optional().or(z.literal('')),
});

/**
 * Тип данных формы отзыва (извлечен из Zod схемы)
 */
export type ReviewFormData = z.infer<typeof reviewSchema>;

/**
 * Zod схема для валидации формы ответа на отзыв
 */
export const reviewReplySchema = z.object({
  reply: z
    .string()
    .min(5, 'Минимальная длина ответа — 5 символов')
    .max(1000, 'Максимальная длина ответа — 1000 символов')
    .trim(),
});

/**
 * Тип данных формы ответа на отзыв
 */
export type ReviewReplyFormData = z.infer<typeof reviewReplySchema>;

/**
 * Zod схема для валидации формы жалобы на отзыв
 */
export const reportReviewSchema = z.object({
  reason: z
    .string()
    .min(5, 'Минимальная длина причины — 5 символов')
    .max(500, 'Максимальная длина причины — 500 символов')
    .trim(),
});

/**
 * Тип данных формы жалобы на отзыв
 */
export type ReportReviewFormData = z.infer<typeof reportReviewSchema>;
