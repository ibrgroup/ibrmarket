"use client"
import React, { useEffect, useMemo, useState } from 'react';

type Section = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: 'section-1',
    title: '1. Доставка: Варианты доставки',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-3xl bg-gray-100">
          <strong>Бесплатная доставка</strong>
          <div>При заказе от 5000 ₽ по всей России</div>
        </div>
        <div className="p-4 rounded-3xl bg-gray-100">
          <strong>Экспресс-доставка</strong>
          <div>1-2 дня, 500 ₽</div>
        </div>
        <div className="p-4 rounded-3xl bg-gray-100">
          <strong>Стандартная доставка</strong>
          <div>3-7 дней, от 300 ₽</div>
        </div>
      </div>
    ),
  },
  {
    id: 'section-2',
    title: '2. Способы доставки',
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        <div className="p-4 rounded-3xl bg-white">
          <div className="font-semibold mb-2">Курьерская доставка</div>
          <div className="text-sm text-gray-700 mb-2">
            Доставка курьером до двери в удобное для вас время.
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Работаем с 9:00 до 21:00</li>
            <li>Возможность примерки</li>
            <li>Оплата наличными или картой</li>
          </ul>
        </div>

        <div className="p-4 rounded3-xl bg-white">
          <div className="font-semibold mb-2">Пункты выдачи</div>
          <div className="text-sm text-gray-700 mb-2">
            Заберите заказ в удобном для вас пункте выдачи.
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Более 1000 пунктов по всей России</li>
            <li>Работаем 24/7</li>
            <li>Быстрое оформление</li>
          </ul>
        </div>

        <div className="p-4 rounded-3xl bg-white">
          <div className="font-semibold mb-2">Почта России</div>
          <div className="text-sm text-gray-700 mb-2">
            Доставка почтой в любую точку страны.
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Доступная стоимость</li>
            <li>Отслеживание посылки</li>
            <li>Наложенный платеж</li>
          </ul>
        </div>

        <div className="p-4 rounded-3xl bg-white">
          <div className="font-semibold mb-2">Транспортные компании</div>
          <div className="text-sm text-gray-700 mb-2">
            Доставка через транспортные компании.
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Быстрая доставка в регионы</li>
            <li>Оплата при получении</li>
            <li>Страховка груза</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'section-3',
    title: '3. Информация о доставке',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-3xl bg-white">
          <strong>Сроки доставки</strong>
          <div className="text-sm text-gray-700 mt-1">
            Сроки доставки зависят от региона и выбранного способа доставки. После оформления заказа вы получите точную информацию о сроках доставки.
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white">
          <strong>Отслеживание заказа</strong>
          <div className="text-sm text-gray-700 mt-1">
            Вы можете отслеживать статус вашего заказа в личном кабинете или по предоставленному трек-номеру.
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white">
          <strong>Изменение адреса доставки</strong>
          <div className="text-sm text-gray-700 mt-1">
            Если вам нужно изменить адрес доставки, свяжитесь с нами как можно скорее до отправки заказа.
          </div>
        </div>
      </div>
    ),
  },
];

const SectionCard: React.FC<Section> = ({ id, title, content }) => (
  <section id={id} className="bg-white rounded-3xl p-6 transition-shadow">
    <h2 className="text-2xl font-roboto mb-3" aria-labelledby={`${id}-title`}>
      {title}
    </h2>
    <div id={`${id}-title`} className="text-gray-700">
      {content}
    </div>
  </section>
);

// Хук для подсветки активного раздела (scrollspy)
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (!ids.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible.length) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0.1 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

export default function Delivery() {
  const sectionIds = useMemo(() => sections.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="max-container mt-3 text-gray-800 antialiased min-h-screen scroll-smooth">
      <header className="bg-gradient-to-r rounded-3xl from-indigo-600 via-sky-500 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-white text-4xl px-1 dark:text-[#f2f2f2] font-roboto">
            Доставка
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">
            Варианты и детали доставки по заказам в нашем маркетплейсе.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6">
        {/* Левая навигация (видна на больших экранах) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 self-start h-fit">
          <nav aria-label="Оглавление доставки" className="bg-white rounded-3xl p-4">
            <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-700">Оглавление</h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={
                      'block rounded px-2 py-2 transition-colors ' +
                      (activeId === sec.id
                        ? 'block rounded-2xl px-3 p-2 text-sm transition-colors bg-emerald-50 border text-green-900 border-emerald-200 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50')
                    }
                  >
                    {sec.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Основной контент */}
        <main className="lg:col-span-9 md:col-span-12 w-full">
          {/* Мобильная навигация */}
          <div className="md:hidden mb-4">
            <details className="bg-white rounded-xl p-3" open={mobileNavOpen}>
              <summary
                className="cursor-pointer text-sm font-semibold text-gray-700"
                onClick={() => setMobileNavOpen((s) => !s)}
              >
                Навигация по разделам
              </summary>
              <ul className="mt-2 space-y-1 pl-4 text-sm">
                {sections.map((sec) => (
                  <li key={sec.id}>
                    <a href={`#${sec.id}`} className="text-blue-600 hover:underline">
                      {sec.title}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          {/* Контент секций */}
          <section aria-label="Доставка" className="space-y-6">
            {sections.map((sec) => (
              <SectionCard key={sec.id} id={sec.id} title={sec.title} content={sec.content} />
            ))}
          </section>
        </main>
      </div>

      {/* Кнопка наверх */}
      <button
        onClick={goTop}
        aria-label="Вернуться наверх"
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none"
        title="Вернуться наверх"
      >
        ↑
      </button>

    </div>
  );
}