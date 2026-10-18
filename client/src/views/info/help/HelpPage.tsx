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
    title: '1. Как оформить заказ?',
    content: (
      <>
        <p className="mb-2">
          Выберите интересующий вас товар, добавьте его в корзину, затем перейдите к оформлению заказа. Укажите адрес доставки, способ оплаты и другие необходимые данные.
        </p>
      </>
    ),
  },
  {
    id: 'section-2',
    title: '2. Как отследить заказ?',
    content: (
      <>
        <p className="mb-2">
          Вы можете отслеживать статус вашего заказа в личном кабинете или по предоставленному трек-номеру на нашем сайте или сайте службы доставки.
        </p>
      </>
    ),
  },
  {
    id: 'section-3',
    title: '3. Можно ли вернуть товар?',
    content: (
      <>
        <p className="mb-2">
          Да, вы можете вернуть товар в течение 14 дней с момента получения при условии, что товар не был в употреблении и сохранен его товарный вид.
        </p>
      </>
    ),
  },
  {
    id: 'section-4',
    title: '4. Как связаться с поддержкой?',
    content: (
      <>
        <p className="mb-2">
          Вы можете связаться с нашей службой поддержки по телефону, электронной почте или через форму обратной связи на сайте.
        </p>
        <p className="mb-2">
          Телефон: +7 (XXX) XXX-XX-XX
        </p>
        <p className="mb-2">
          Email: support@example.com
        </p>
      </>
    ),
  },
  {
    id: 'section-5',
    title: '5. Какие способы оплаты доступны?',
    content: (
      <>
        <p className="mb-2">
          Мы принимаем оплату банковскими картами, электронными деньгами, наличными при получении и другие способы оплаты, которые указаны при оформлении заказа.
        </p>
      </>
    ),
  },
  {
    id: 'section-6',
    title: '6. Служба поддержки',
    content: (
      <>
        <div className="mb-2 font-semibold">Контактная информация</div>
        <div className="space-y-1">
          <div><strong>Телефон:</strong> +7 (XXX) XXX-XX-XX</div>
          <div><strong>Email:</strong> support@example.com</div>
          <div><strong>Часы работы:</strong> Пн-Пт: 9:00-18:00</div>
        </div>

        <div className="mt-4 font-semibold">Онлайн поддержка</div>
        <div>Наша команда готова помочь вам онлайн в рабочее время.</div>

        <div className="mt-2">
          <a href="#" className="text-blue-600 hover:underline">
            Написать в чат
          </a>
        </div>
      </>
    ),
  },
  {
    id: 'section-7',
    title: '7. Инструкции',
    content: (
      <>
        <div className="mb-2 font-roboto text-lg">Регистрация аккаунта</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Нажмите на кнопку "Регистрация" в верхней части сайта</li>
          <li>Введите свои данные: имя, email и пароль</li>
          <li>Подтвердите email, перейдя по ссылке в письме</li>
          <li>Войдите в свой аккаунт и настройте профиль</li>
        </ol>

        <div className="mt-4 mb-2 font-roboto text-lg">Создание заказа</div>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Выберите товар и добавьте его в корзину</li>
          <li>Перейдите в корзину и проверьте состав заказа</li>
          <li>Нажмите "Оформить заказ" и заполните данные</li>
          <li>Выберите способ доставки и оплаты</li>
          <li>Подтвердите заказ</li>
        </ol>
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

export default function Help() {
  const sectionIds = useMemo(() => sections.map((s) => s.id), []);
  const activeId = useActiveSection(sectionIds);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // плавный возврат наверх
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="max-container mt-3 text-gray-800 antialiased min-h-screen scroll-smooth">
      <header className="bg-gradient-to-r rounded-3xl from-indigo-600 via-sky-500 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-white text-4xl px-1 dark:text-[#f2f2f2] font-roboto">
            Помощь
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-90">
            Часто задаваемые вопросы и инструкции по работе с маркетплейсом.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-12 gap-6">
        {/* Левая навигация (видна на больших экранах) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 self-start h-fit">
          <nav aria-label="Оглавление помощи" className="bg-white rounded-3xl p-4">
            <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide text-gray-700">Оглавление</h3>
            <ul className="space-y-1">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className={
                      'block rounded-2xl px-3 p-2 text-sm transition-colors ' +
                      (activeId === sec.id
                        ? 'bg-emerald-50 border text-green-900 border-emerald-200 font-semibold'
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
            <details className="bg-white border border-gray-200 rounded-3xl p-3" open={mobileNavOpen}>
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
          <section aria-label="Помощь" className="space-y-6">
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

      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 text-sm text-center text-gray-600">
          © 2026 Ваш маркетплейс
        </div>
      </footer>
    </div>
  );
}