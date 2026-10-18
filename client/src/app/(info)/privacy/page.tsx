"use client"
import React, { useEffect, useMemo, useState } from 'react';

type Section = {
  id: string;
  title: string;
  text: string;
};

const sections: Section[] = [
  {
    id: 'section-1',
    title: '1. Сбор данных',
    text:
      'При регистрации, оформлении заказа или взаимодействии с сайтом мы можем собирать следующую информацию: имя, фамилия; контактный телефон; адрес электронной почты; адрес доставки; история заказов и взаимодействий.',
  },
  {
    id: 'section-2',
    title: '2. Использование данных',
    text:
      'Ваши данные используются для обработки и управления заказами, связи с вами по вопросам заказа, улучшения работы маркетплейса и пользовательского опыта, отправки уведомлений и новостей (по согласию).',
  },
  {
    id: 'section-3',
    title: '3. Безопасность данных',
    text:
      'Мы реализуем современные меры защиты данных пользователей и используем защищённое соединение (HTTPS). Все персональные данные хранятся на защищённых серверах.',
  },
  {
    id: 'section-4',
    title: '4. Передача третьим лицам',
    text:
      'Мы не передаём ваши персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом (например, доставка товаров).',
  },
  {
    id: 'section-5',
    title: '5. Cookies и аналитика',
    text:
      'Мы используем cookies для персонализации контента и аналитики посещаемости (Яндекс.Метрика, Google Analytics). Вы можете отключить cookies в настройках браузера.',
  },
  {
    id: 'section-6',
    title: '6. Права пользователя',
    text:
      'Вы можете запросить удаление или изменение своих данных, обратившись по электронной почте: support@ibrmarket.ru',
  },
  {
    id: 'section-7',
    title: '7. Изменения политики',
    text:
      'Мы можем периодически обновлять эту политику, уведомляя пользователей о существенных изменениях через сайт.',
  },
  {
    id: 'section-8',
    title: '8. Контактная информация',
    text:
      'По всем вопросам защиты данных обращайтесь: support@ibrmarket.ru',
  },
];

// Простой секционный компонент
const SectionCard: React.FC<Section> = ({ id, title, text }) => (
  <section id={id} className="bg-white rounded-3xl p-6">
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

export default function PrivacyPolicy() {
  const sectionIds = useMemo(() => sections.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // плавный возврат наверх
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="max-container text-gray-800 mt-3 antialiased min-h-screen scroll-smooth">
      <header className="bg-gradient-to-r rounded-3xl from-indigo-500 to-teal-500 text-white">
        <div className="mx-auto px-4 py-8">
          <h1 className="text-white text-2xl px-1 dark:text-[#f2f2f2] font-roboto">
            Политика конфиденциальности
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">
            Настоящая политика конфиденциальности определяет порядок сбора, хранения, использования и защиты персональных данных пользователей маркетплейса IBR-Market (ibrmarket.com).
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6">
        {/* Левая навигация (видна на больших экранах) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 self-start h-fit">
          <nav aria-label="Оглавление политики" className="bg-white rounded-3xl p-4">
            <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-700">Оглавление</h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={
                      'block rounded px-2 text-sm p-2 transition-colors ' +
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

          {/* Контент секций в сетке карточек */}
          <section aria-label="Политика конфиденциальности" className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              Дата последнего обновления: 2026-08-01
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((sec) => (
                <SectionCard key={sec.id} id={sec.id} title={sec.title} text={sec.text} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Кнопка наверх */}
      <button
        onClick={goTop}
        aria-label="Вернуться наверх"
        className="fixed bottom-6 right-6 bg-emerald-600 text-white p-3 rounded-full hover:bg-emerald-700 focus:outline-none"
        title="Вернуться наверх"
      >
        ↑
      </button>

    </div>
  );
}