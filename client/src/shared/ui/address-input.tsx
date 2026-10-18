'use client';

import {
  type DadataStructuredAddress,
  structuredAddressFromDadataSuggestion,
} from '@/shared/lib/dadata-address';
import { cn } from '@/shared/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Input } from './input';

export interface AddressSuggestion {
  value: string;
  unrestricted_value?: string;
  data?: unknown;
}

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  /** Вызывается при выборе подсказки с полным разбором; при ручном вводе — null */
  onParsedAddress?: (parsed: DadataStructuredAddress | null) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function AddressInput({
  value,
  onChange,
  onParsedAddress,
  placeholder = 'Начните вводить адрес — город, улицу, дом',
  className,
  id,
  disabled,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Не перезаписывать полную строку подсказки значением line1 из формы */
  const skipNextPropSyncRef = useRef(false);

  useEffect(() => {
    if (skipNextPropSyncRef.current) {
      skipNextPropSyncRef.current = false;
      return;
    }
    setInputValue(value);
    if (value === '') {
      setHasUserInteracted(false);
    }
  }, [value]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!isFocused || !hasUserInteracted) {
      return;
    }

    if (!inputValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/dadata/address', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: inputValue.trim(),
            count: 10,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data?.suggestions) {
          const formattedSuggestions: AddressSuggestion[] = data.data.suggestions.map(
            (s: AddressSuggestion) => ({
              value: s.value || '',
              unrestricted_value: s.unrestricted_value || s.value || '',
              data: s.data,
            }),
          );
          setSuggestions(formattedSuggestions);
          setIsOpen(formattedSuggestions.length > 0);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.error('[AddressInput] Error fetching suggestions:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки подсказок');
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, isFocused, hasUserInteracted]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    setHasUserInteracted(true);
    onChange(newValue);
    onParsedAddress?.(null);
  };

  const handleSelectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      const parsed = structuredAddressFromDadataSuggestion(suggestion);
      const line1 =
        parsed?.address_line1 || suggestion.value || suggestion.unrestricted_value || '';
      const displayValue =
        parsed?.value || suggestion.unrestricted_value || suggestion.value || line1;
      skipNextPropSyncRef.current = true;
      setInputValue(displayValue);
      onChange(line1);
      onParsedAddress?.(parsed ?? null);
      setIsOpen(false);
      setSuggestions([]);
      inputRef.current?.blur();
    },
    [onChange, onParsedAddress],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSuggestions([]);
        break;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setHasUserInteracted(true);
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn('h-12 rounded-2xl pl-10 pr-10', className)}
          disabled={disabled}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-border bg-popover py-1 shadow-lg outline-none dark:border-gray-700 dark:bg-gray-900"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.value}-${index}`}
              type="button"
              role="option"
              aria-selected={selectedIndex === index}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                'flex w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                selectedIndex === index && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="line-clamp-2">{suggestion.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
