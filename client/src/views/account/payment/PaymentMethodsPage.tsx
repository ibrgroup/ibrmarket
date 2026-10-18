'use client';

import { LayoutContainer } from '@/shared/ui/layout-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { Badge } from '@/shared/ui/badge';
import { CreditCard, Trash2, Star, Plus, Smartphone } from 'lucide-react';
import { useState } from 'react';

type PaymentCard = {
  id: string;
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  isDefault: boolean;
};

export function PaymentMethodsPage() {
  const [cards, setCards] = useState<PaymentCard[]>([
    {
      id: '1',
      cardNumber: '**** **** **** 1234',
      expiryDate: '12/25',
      cardholderName: 'Иван Иванов',
      isDefault: true,
    },
    {
      id: '2',
      cardNumber: '**** **** **** 5678',
      expiryDate: '11/24',
      cardholderName: 'Иван Иванов',
      isDefault: false,
    },
  ]);

  const [form, setForm] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const formatCardNumber = (value: string) =>
    value
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
  const formatExpiry = (value: string) =>
    value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d{0,2})/, '$1/$2')
      .slice(0, 5);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number || !form.name || !form.expiry || !form.cvv) return;

    const newCard: PaymentCard = {
      id: Date.now().toString(),
      cardNumber: `**** **** **** ${form.number.slice(-4)}`,
      expiryDate: form.expiry,
      cardholderName: form.name.toUpperCase(),
      isDefault: cards.length === 0,
    };

    setCards([...cards, newCard]);
    setForm({ number: '', name: '', expiry: '', cvv: '' });
  };

  const setDefault = (id: string) => setCards(cards.map(c => ({ ...c, isDefault: c.id === id })));
  const remove = (id: string) => setCards(cards.filter(c => c.id !== id));

  return (
    <LayoutContainer className="py-8">
      <Card className="mx-auto max-w-4xl shadow-xl">
        <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CreditCard className="h-7 w-7" /> Способы оплаты
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 p-6">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <CreditCard className="h-5 w-5 text-blue-600" /> Привязанные карты
            </h2>

            <div className="space-y-3">
              {cards.length === 0 ? (
                <p className="italic text-muted-foreground">Нет привязанных карт</p>
              ) : (
                cards.map(card => (
                  <div
                    key={card.id}
                    className={`group relative rounded-xl border p-5 transition-all ${
                      card.isDefault
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-sm font-bold text-white">
                          {card.cardNumber.slice(-4)}
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{card.cardNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {card.cardholderName} • {card.expiryDate}
                          </p>
                        </div>
                        {card.isDefault && (
                          <Badge className="ml-2" variant="default">
                            <Star className="mr-1 h-3 w-3" /> Основная
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {!card.isDefault && (
                          <Button size="sm" variant="outline" onClick={() => setDefault(card.id)}>
                            <Star className="mr-1 h-4 w-4" /> Основная
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => remove(card.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Plus className="h-5 w-5 text-green-600" /> Добавить карту
            </h2>

            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Номер карты</Label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={form.number}
                  onChange={e => setForm({ ...form, number: formatCardNumber(e.target.value) })}
                  maxLength={19}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Имя владельца</Label>
                <Input
                  placeholder="ИВАН ИВАНОВ"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <Label>Срок действия</Label>
                <Input
                  placeholder="MM/YY"
                  value={form.expiry}
                  onChange={e => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                  maxLength={5}
                  required
                />
              </div>

              <div>
                <Label>CVV</Label>
                <Input
                  placeholder="123"
                  type="password"
                  value={form.cvv}
                  onChange={e =>
                    setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })
                  }
                  maxLength={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full md:col-span-2 md:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Привязать карту
              </Button>
            </form>
          </section>

          <Separator />

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Smartphone className="h-5 w-5 text-emerald-600" /> Система быстрых платежей
            </h2>

            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <div className="flex-1 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                <p className="font-medium text-emerald-900">Оплата через СБП</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Мгновенная оплата из любого банка через мобильное приложение
                </p>
              </div>
              <Button
                variant="outline"
                className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
              >
                Подключить СБП
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </LayoutContainer>
  );
}
