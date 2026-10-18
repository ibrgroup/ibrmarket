'use client';

import { usePaymentStatus, useTransactions } from '@/shared/store/payment';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Pagination, PaginationContent, PaginationItem } from '@/shared/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { SettingsErrorAlert, SettingsPageSkeleton } from '../SettingsFeedback';
import { SettingsPageHeader } from '../SettingsPageHeader';

export function PaymentHistoryPage() {
  const { transactions, actions } = useTransactions();
  const { isLoading, error, clearError } = usePaymentStatus();

  const [dateRange, setDateRange] = useState('last30');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    actions.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    let fromDate: Date;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    switch (dateRange) {
      case 'last7':
        fromDate = new Date(startOfToday);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case 'last30':
        fromDate = new Date(startOfToday);
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case 'last90':
        fromDate = new Date(startOfToday);
        fromDate.setDate(fromDate.getDate() - 90);
        break;
      default:
        fromDate = new Date(0);
    }
    const tDate = new Date(t.date);
    const matchesDate = tDate >= fromDate;
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const groupedTransactions = paginatedTransactions.reduce(
    (acc, t) => {
      const date = t.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(t);
      return acc;
    },
    {} as Record<string, typeof transactions>,
  );

  const totalSpent = filteredTransactions
    .filter((t) => t.status === 'completed' || t.status === 'refunded')
    .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);

  const totalRefunded = filteredTransactions
    .filter((t) => t.status === 'refunded')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  if (isLoading) return <SettingsPageSkeleton />;
  if (error) {
    return <SettingsErrorAlert message={error} onDismiss={clearError} />;
  }

  return (
    <div className="max-container mx-auto px-4 py-3 sm:py-3">
      <SettingsPageHeader
        icon={CreditCard}
        title="История платежей"
        description="Оплаты и суммы по вашим заказам. Подробности заказа — в разделе «Мои заказы»."
        backHref="/settings"
      />

      <Card className="mb-6 border-border/80">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Статистика</CardTitle>
          <CardDescription>
            По заказам в статусах «Оплачен» и «Доставлен». Возвраты отображаются, когда появятся в
            системе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                    Всего потрачено
                  </p>
                  <p className="truncate text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                    {totalSpent.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 dark:bg-emerald-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">Возвращено</p>
                  <p className="truncate text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                    {totalRefunded.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-violet-500/25 bg-violet-500/8 p-4 dark:bg-violet-500/10">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                  <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground sm:text-sm">Транзакций</p>
                  <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                    {filteredTransactions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-border/80">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Фильтры</CardTitle>
          <CardDescription>Период и поиск по описанию или номеру заказа</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-history-period" className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground bg-gray-100" aria-hidden />
                Период
              </Label>
              <Select
                value={dateRange}
                onValueChange={(v) => {
                  setDateRange(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger id="payment-history-period" className="h-10 bg-gray-100 w-full md:w-full">
                  <SelectValue placeholder="Период" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все время</SelectItem>
                  <SelectItem value="last7">Последние 7 дней</SelectItem>
                  <SelectItem value="last30">Последние 30 дней</SelectItem>
                  <SelectItem value="last90">Последние 90 дней</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-history-search" className="flex items-center gap-2 text-sm">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
                Поиск
              </Label>
              <Input
                id="payment-history-search"
                type="search"
                placeholder="Описание или ID заказа…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 bg-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <div key={date} className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {format(new Date(date), 'd MMMM yyyy', { locale: ru })}
            </h2>
            <Card className="overflow-hidden border-border/80">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Заказ</TableHead>
                        <TableHead>Описание</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="max-w-[140px]">
                            <span
                              className="font-mono text-xs font-medium text-foreground"
                              title={transaction.orderId}
                            >
                              …{transaction.orderId.slice(-8)}
                            </span>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="tabular-nums">
                            {transaction.amount > 0
                              ? `+${transaction.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}`
                              : transaction.amount.toLocaleString('ru-RU', {
                                  style: 'currency',
                                  currency: 'RUB',
                                })}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                transaction.status === 'completed'
                                  ? 'default'
                                  : transaction.status === 'pending'
                                    ? 'secondary'
                                    : transaction.status === 'refunded'
                                      ? 'destructive'
                                      : 'outline'
                              }
                            >
                              {transaction.status === 'completed'
                                ? 'Завершено'
                                : transaction.status === 'pending'
                                  ? 'В обработке'
                                  : transaction.status === 'refunded'
                                    ? 'Возвращено'
                                    : 'Отменено'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/my-orders/${transaction.orderId}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Подробнее
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <Card className="border-border/80">
            <CardContent className="p-10 text-center">
              <div className="mb-4 flex justify-center">
                <CreditCard className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">История платежей пуста</h3>
              <p className="text-sm text-muted-foreground">
                Нет транзакций по выбранным фильтрам. Измените период или поисковый запрос.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {filteredTransactions.length > 0 && (
        <Pagination className="mt-8 flex justify-center">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </PaginationItem>
            <PaginationItem className="flex items-center px-2">
              <span className="text-sm font-medium">
                Страница {currentPage} из {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="ghost"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
