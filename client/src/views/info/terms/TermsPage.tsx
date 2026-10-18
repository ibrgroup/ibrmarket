'use client'

import React, { useEffect, useMemo, useState } from 'react';

type Section = {
  id: string;
  title: string;
  text: string;
};

const sections: Section[] = [
  {
    id: 'section-1',
    title: '1. Общие положения',
    text:
      'Настоящие Условия использования регулируют отношения между вами и нашим интернет-магазином. Используя наш веб-сайт, вы соглашаетесь соблюдать данные условия.',
  },
  {
    id: 'section-2',
    title: '2. Описание услуги',
    text:
      'Мы предоставляем платформу для онлайн-покупок товаров. Все товары, представленные на сайте, доступны для покупки в соответствии с условиями, указанными на странице продукта.',
  },
  {
    id: 'section-3',
    title: '3. Регистрация пользователя',
    text:
      'Для доступа к некоторым функциям сайта может потребоваться регистрация. Вы несете ответственность за сохранение конфиденциальности своей учетной записи.',
  },
  {
    id: 'section-4',
    title: '4. Права интеллектуальной собственности',
    text:
      'Все материалы на сайте, включая тексты, изображения, логотипы, являются собственностью компании и защищены законами об интеллектуальной собственности.',
  },
  {
    id: 'section-5',
    title: '5. Ограничения использования',
    text:
      'Запрещено использовать сайт для незаконных целей или любых действий, которые могут повредить работу сайта или нарушить права других пользователей.',
  },
  {
    id: 'section-6',
    title: '6. Отказ от гарантий',
    text:
      'Сайт предоставляется "как есть", без каких-либо гарантий. Мы не гарантируем безошибочную работу сайта или его соответствие вашим требованиям.',
  },
  {
    id: 'section-7',
    title: '7. Изменения условий',
    text:
      'Мы оставляем за собой право изменять данные условия в любое время. Изменения вступают в силу с момента публикации на сайте.',
  },
  {
    id: 'section-8',
    title: '8. Контактная информация',
    text:
      'По всем вопросам, связанным с условиями использования, обращайтесь по адресу: info@example.com',
  },
];

// Простой секционный компонент
const SectionCard: React.FC<Section> = ({ id, title, text }) => (
  <section id={id} className="bg-white rounded-3xl p-6 mb-8 ">
    <h2 className="text-2xl font-roboto mb-3" aria-labelledby={`${id}-title`}>
      {title}
    </h2>
    <p id={`${id}-title`} className="text-gray-700 leading-relaxed">
      {text}
    </p>
  </section>
);

// Хук для подсветки активного раздела (scrollspy)
function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (!ids.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // выбираем самый ближний к верху видимый элемент
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

export default function TermsOfUse() {
  const sectionIds = useMemo(() => sections.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);

  // плавный возврат наверх
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="max-container m-auto rounded-3xl mt-3">
      <header className="bg-gradient-to-r rounded-3xl from-indigo-600 via-sky-500 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-white text-2xl px-1 dark:text-[#f2f2f2] font-roboto">
            Условия использования
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">
            Красивые и понятные правила для пользователей нашего магазина.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6">
        {/* Левый навигационный блок (видимо на большом экране) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 self-start h-fit">
          <nav aria-label="Оглавление" className="bg-white rounded-3xl p-4">
            <h3 className="text-xl font-roboto mb-2 uppercase tracking-wide text-gray-700">Оглавление</h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={
                      'block rounded-xl text-sm p-2 text-md px-3 transition-colors ' +
                      (activeId === sec.id
                        ? 'bg-white text-indigo-700 border border-indigo-200 font-semibold'
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
          {/* Мобильная навигация ( collapsible ) */}
          <div className="md:hidden mb-4">
            <details className="bg-white border border-gray-200 rounded-xl p-3">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700">Навигация по разделам</summary>
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
          <section aria-label="Условия" className="space-y-6">
            {sections.map((sec) => (
              <SectionCard key={sec.id} id={sec.id} title={sec.title} text={sec.text} />
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