'use client';

import { useUserStore } from '@/entities/user';
import { cn } from '@/shared/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Edit, Flag, MoreVertical, Star, ThumbsUp, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { memo, useState } from 'react';
import { REVIEW_BACKEND_FEATURES } from '../model/constants';
import type { ReviewItemProps } from '../model/types';

/**
 * Компонент для отображения одного отзыва
 * Мемоизирован для оптимизации рендеринга в длинных списках
 */
export const ReviewItem = memo(function ReviewItem({
  review,
  onEdit,
  onDelete,
  onLike,
  onReport,
  className,
}: ReviewItemProps) {
  const { user } = useUserStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = user?._id === review.userId;
  const hasMenuActions =
    (isOwner && (REVIEW_BACKEND_FEATURES.canEdit || REVIEW_BACKEND_FEATURES.canDelete)) ||
    (!isOwner && REVIEW_BACKEND_FEATURES.canReport);

  const handleDelete = () => {
    onDelete?.(review._id);
    setShowDeleteDialog(false);
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: ru });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <div
        className={cn(
          'space-y-3 rounded-2xl bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900',
          className,
        )}
      >
        {/* Заголовок отзыва */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={review.userAvatar} alt={review.userName} />
              <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-900 dark:text-zinc-100">{review.userName}</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                <span>{formatDate(review.createdAt)}</span>
                {review.updatedAt && review.updatedAt !== review.createdAt && (
                  <span className="text-gray-400 dark:text-zinc-500">(отредактировано)</span>
                )}
              </div>
            </div>
          </div>

          {/* Действия */}
          {(isOwner || user) && hasMenuActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && REVIEW_BACKEND_FEATURES.canEdit && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit?.(review._id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                  </>
                )}
                {isOwner && REVIEW_BACKEND_FEATURES.canDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                )}
                {!isOwner && user && REVIEW_BACKEND_FEATURES.canReport && (
                  <DropdownMenuItem onClick={() => onReport?.(review._id)}>
                    <Flag className="mr-2 h-4 w-4" />
                    Пожаловаться
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Рейтинг */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300 dark:text-zinc-600',
              )}
            />
          ))}
        </div>

        {/* Текст отзыва */}
        <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">
          {review.review}
        </p>

        {/* Изображение (если есть) */}
        {review.image && (
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg">
            <Image src={review.image} alt="Фото к отзыву" fill className="object-cover" />
          </div>
        )}

        {/* Действия снизу */}
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(review._id)}
            disabled={!REVIEW_BACKEND_FEATURES.canLike}
            className="gap-2 text-gray-600 hover:text-primary dark:text-zinc-400 dark:hover:text-primary"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">
              {review.helpfulCount ? `Полезно (${review.helpfulCount})` : 'Полезно'}
            </span>
          </Button>
        </div>
      </div>

      {/* Диалог удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот отзыв? Это действие необратимо.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
