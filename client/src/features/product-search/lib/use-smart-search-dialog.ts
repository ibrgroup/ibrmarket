import { ProductService } from '@/shared/api/services/product-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { searchSchema, type SearchFormData } from '../model/schema';
import type { SearchSuggestion } from '../model/types';
import { getProductPathForSingleSearchHit, searchListingPath } from './search-navigation';

export interface UseSmartSearchDialogReturn {
  open: boolean;
  handleSearchOpen: () => void;
  handleSearchClose: () => void;
  register: ReturnType<typeof useForm<SearchFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<SearchFormData>>['handleSubmit'];
  onSubmit: (data: SearchFormData) => void | Promise<void>;
  onError: () => void;
  errors: ReturnType<typeof useForm<SearchFormData>>['formState']['errors'];
  isSubmitting: boolean;
  control: ReturnType<typeof useForm<SearchFormData>>['control'];
  query: string;
  clearInput: () => void;
  setValue: ReturnType<typeof useForm<SearchFormData>>['setValue'];
  suggestions: SearchSuggestion[];
  popular: string[];
  recent: string[];
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  reset: ReturnType<typeof useForm<SearchFormData>>['reset'];
}

export function useSmartSearchDialog(): UseSmartSearchDialogReturn {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [popular, setPopular] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Загружаем историю поиска из localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('recent-searches');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecent(parsed.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
    mode: 'onChange',
  });

  const query = useWatch({ control, name: 'query' }) ?? '';

  // Focus input when opening dialog -- фиксим: фокус без setTimeout через ref-proxy
  const handleSearchOpen = () => {
    setOpen(true);
  };

  const handleSearchClose = useCallback(() => {
    setOpen(false);
    reset({ query: '' });
    setSuggestions([]);
    setPopular([]);
    // Leave recent unchanged
  }, [reset]);

  // Debounced fetching suggestions
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      return;
    }
    let ignore = false;
    setIsLoading(true);

    const doFetch = async () => {
      try {
        // Don't fire API on blank input, but still reset lists
        if (!query.trim()) {
          setSuggestions([]);
          setPopular([]);
          setIsLoading(false);
          return;
        }

        const resp = await ProductService.autocompleteSearch(query.trim());
        if (!ignore) {
          const data = resp.data || resp;
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
          setPopular(Array.isArray(data.popular) ? data.popular : []);
        }
      } catch {
        if (!ignore) {
          setSuggestions([]);
          setPopular([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    const debounceDelay = query.trim() !== '' ? 300 : 0;
    const id = setTimeout(doFetch, debounceDelay);
    return () => {
      ignore = true;
      clearTimeout(id);
      setIsLoading(false);
    };
  }, [open, query]);

  // Clear input - просто сбрасываем state, не дергаем фокусы (пусть контролит родитель инпута)
  const clearInput = useCallback(() => {
    setValue('query', '');
    setSuggestions([]);
    setPopular([]);
  }, [setValue]);

  const onSubmit = useCallback(
    async (data: SearchFormData) => {
      const val = data.query.trim();
      if (!val) return;

      // Сохраняем в историю поиска
      try {
        const stored = localStorage.getItem('recent-searches');
        let recentList: string[] = stored ? JSON.parse(stored) : [];
        recentList = recentList.filter((item) => item.toLowerCase() !== val.toLowerCase());
        recentList.unshift(val);
        recentList = recentList.slice(0, 10);
        localStorage.setItem('recent-searches', JSON.stringify(recentList));
        setRecent(recentList);
      } catch (error) {
        console.error('Error saving recent search:', error);
      }

      const path = await getProductPathForSingleSearchHit(val, queryClient);
      router.push(path ?? searchListingPath(val));
      reset();
      setOpen(false);
    },
    [router, reset, queryClient],
  );

  const onError = useCallback(() => {
    toast.error('Произошла ошибка при поиске. Пожалуйста, попробуйте ещё раз.');
  }, []);

  return {
    open,
    handleSearchOpen,
    handleSearchClose,
    register,
    handleSubmit,
    onSubmit,
    onError,
    errors,
    isSubmitting,
    control,
    query,
    clearInput,
    setValue,
    suggestions,
    popular,
    recent,
    isLoading,
    setOpen,
    reset,
  };
}
