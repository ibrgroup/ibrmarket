'use client';

import { cn } from '@/shared/lib/utils';
import { useLocationStore } from '@/shared/store/location';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

/**
 * Популярные города для быстрого выбора
 */
const POPULAR_CITIES = [
  { id: 'magas', name: 'Магас' },
  { id: 'nazran', name: 'Назрань' },
  { id: 'karabulak', name: 'Карабулак' },
  { id: 'sunzha', name: 'Сунжа' },
  { id: 'malgobek', name: 'Малгобек' },
  { id: 'moscow', name: 'Москва' },
  { id: 'spb', name: 'Санкт-Петербург' },
  { id: 'ekb', name: 'Екатеринбург' },
  { id: 'kazan', name: 'Казань' },
  { id: 'nn', name: 'Нижний Новгород' },
  { id: 'novosibirsk', name: 'Новосибирск' },
  { id: 'rostov', name: 'Ростов-на-Дону' },
  { id: 'ufa', name: 'Уфа' },
];

interface CitySelectorProps {
  className?: string;
}

export function CitySelector({ className }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { city, setCity } = useLocationStore();

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCitySelect = (cityName: string) => {
    setCity(cityName);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-auto gap-1.5 px-2 py-1 text-white text-xs font-normal  hover:text-foreground',
            className,
          )}
        >
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" className="uw_n4a"><rect width="19" height="13" x="2.5" y="5.5" stroke="#001A34" stroke-opacity=".16" opacity=".75" rx="2.5"></rect><path fill="white" d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3z"></path><path fill="#0055CC" d="M3 10h18v4H3z"></path><path fill="#F0121F" d="M3 14h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg> */}
          <MapPin className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{city}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-2">
          <Input
            placeholder="Поиск города..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
          <div className="max-h-[200px] space-y-1 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((cityItem) => (
                <Button
                  key={cityItem.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => handleCitySelect(cityItem.name)}
                >
                  {cityItem.name}
                </Button>
              ))
            ) : (
              <p className="text-center text-xs text-muted-foreground">Город не найден</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
