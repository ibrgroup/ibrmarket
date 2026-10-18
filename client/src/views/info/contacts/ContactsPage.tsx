'use client'
import React, { useEffect, useMemo, useState } from 'react';

type Section = {
  id: string;
  title: string;
  content: React.ReactNode;
};

const sections: Section[] = [
  {
    id: 'section-1',
    title: '1. Свяжитесь с нами',
    content: (
      <>
        <p className="mb-2">
          Если у вас есть вопросы, предложения или жалобы, пожалуйста, свяжитесь с нами любым удобным способом.
          Наша команда готова помочь вам в рабочее время.
        </p>
      </>
    ),
  },
  {
    id: 'section-2',
    title: '2. Контактная информация',
    content: (
      <>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          <li><strong>Телефон:</strong> +7 (XXX) XXX-XX-XX</li>
          <li><strong>Email:</strong> ibrgroup@bk.ru</li>
          <li><strong>Адрес:</strong> г. Москва, ул. Примерная, д. 123, офис 45</li>
        </ul>
      </>
    ),
  },
  {
    id: 'section-3',
    title: '3. Техническая поддержка',
    content: (
      <>
        <p>
          Для вопросов, связанных с работой сайта и аккаунтом, пишите на: <strong>support@example.com</strong>
        </p>
      </>
    ),
  },
  {
    id: 'section-4',
    title: '4. Наши офисы',
    content: (
      <>
        <div className="mb-4 text-sm text-gray-700">Москва — Центральный офис</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <strong>Москва</strong>
            <div>ул. Примерная, д. 123</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <strong>Санкт-Петербург</strong>
            <div>Невский пр., д. 456</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <strong>Новосибирск</strong>
            <div>ул. Советская, д. 789</div>
          </div>
        </div>
      </>
    ),
  },
];

// Простой секционный компонент
const SectionCard: React.FC<Section> = ({ id, title, content }) => (
  <section id={id} className="bg-white rounded-3xl p-6">
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

export default function ContactsPage() {
  const sectionIds = useMemo(() => sections.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // плавный возврат наверх
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="max-container text-gray-800 mt-3 antialiased min-h-screen scroll-smooth">
      <header className="bg-gradient-to-r rounded-3xl from-sky-500 via-indigo-500 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-white text-4xl px-1 dark:text-[#f2f2f2] font-roboto">
            Контакты
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">
            Свяжитесь с нами. Наша команда готова помочь вам.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6">
        {/* Левая навигация (видна на больших экранах) */}
        <aside className="hidden lg:block lg:col-span-3 stickyl top-20 self-start h-fit">
          <nav aria-label="Оглавление контактов" className="bg-white rounded-3xl p-4">
            <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-700">Оглавление</h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={
                      'block rounded-xl text-sm p-2 text-md px-3 transition-colors text-gray-700 hover:bg-gray-50' +
                      (activeId === sec.id
                        ? 'block rounded-xl text-sm p-2 text-md px-3 transition-colors bg-white text-indigo-700 border border-indigo-200 font-semibold'
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
            <details className="bg-white border border-gray-200 rounded-xl p-3" open={mobileNavOpen}>
              <summary className="cursor-pointer text-sm font-semibold text-gray-700" onClick={() => setMobileNavOpen((s) => !s)}>
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
          <section aria-label="Контакты" className="space-y-6">
            {sections.map((sec) => (
              <SectionCard key={sec.id} id={sec.id} title={sec.title} content={sec.content} />
            ))}
          </section>

          {/* Пример: небольшая подсказка даты обновления (если нужно) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 mt-6">
            Дата последнего обновления: 2026-08-01
          </div>
        </main>
      </div>

      {/* Кнопка наверх */}
      <button
        onClick={goTop}
        aria-label="Вернуться наверх"
        className="fixed bottom-6 right-6 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 focus:outline-none"
        title="Вернуться наверх"
      >
        ↑
      </button>
    </div>
  );
}