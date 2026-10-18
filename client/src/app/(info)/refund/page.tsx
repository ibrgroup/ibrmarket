/**IBR Market
 * Страница "Условия возврата" (refund) для маркетплейса IBR Market.
 *
 * Динамическая info-страница без SSR/SSG — не пререндерится на сервере, не включается в initial build.
 * Используйте export const dynamic = 'force-dynamic' для таких редко посещаемых информационных страниц,
 * не содержащих персональных данных или SEO-критичного контента.
 *
 * Пример аналогичных страниц: /about, /terms, /refund.
 */

import { getBaseUrl } from '@/shared/config/site';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

/**
 * Метаданные для страницы "Условия возврата"
 */
export const metadata: Metadata = {
  title: 'Условия возврата',
  description:
    'Узнайте актуальные правила возврата товаров и услуг на маркетплейсе IBR Market. Ответы на частые вопросы о возвратах и гарантиях.',
  openGraph: {
    title: 'Условия возврата | IBR MarketT',
    url: `${getBaseUrl()}/refund`,
    type: 'website',
  },
  alternates: {
    canonical: `${getBaseUrl()}/refund`,
  },
  robots: { index: true, follow: true },
};

/**
 * Информационная страница "Условия возврата"
 * Описывает политику возврата и порядок действий для покупателей IBR Market.
 */
export default function RefundPageRoute() {
  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Условия возврата</h1>
      <div className="space-y-5 text-base md:text-lg leading-relaxed">
        <p>
          В IBR Market мы заботимся о ваших правах и соблюдаем все требования законодательства РФ в
          области возврата товаров и предоставления гарантий. Ниже приведены основные правила и
          порядок возврата товаров, приобретённых на нашем маркетплейсе.
        </p>
        <ol className="list-decimal ml-5 space-y-3">
          <li>
            <b>Возврат товаров надлежащего качества:</b>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>
                Покупатель имеет право отказаться от товара в&nbsp;течение 7&nbsp;календарных дней
                после получения, если товар не был в употреблении, сохранён товарный вид и заводская
                упаковка.
              </li>
              <li>
                Возврат денежных средств осуществляется тем же способом, которым была произведена
                оплата, в течение 7&nbsp;дней с момента получения нами возврата и его проверки.
              </li>
              <li>Расходы по пересылке товара надлежащего качества оплачиваются покупателем.</li>
            </ul>
          </li>
          <li>
            <b>Возврат товаров ненадлежащего качества:</b>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>
                Если товар оказался с&nbsp;браком или не соответствует описанию, вы вправе вернуть
                его или обменять.
              </li>
              <li>Расходы на пересылку товара ненадлежащего качества оплачивает маркетплейс.</li>
              <li>
                Заявление на возврат/обмен можно оформить через форму обратной связи на сайте или
                электронную почту (
                <a className="text-primary underline" href="mailto:support@ibr-market.ru">
                  support@ibrmarket.ru
                </a>
                ).
              </li>
            </ul>
          </li>
          <li>
            <b>Общий порядок возврата:</b>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>
                Для оформления возврата подготовьте:
                <ul className="list-[circle] ml-6 mt-1 space-y-0.5">
                  <li>Фотографии товара (по необходимости)</li>
                  <li>Документ, подтверждающий покупку (электронный чек или заказ)</li>
                </ul>
              </li>
              <li>Обратитесь в службу поддержки через email или чат.</li>
              <li>
                Мы расскажем пошагово, как отправить товар возвратным отправлением (Почта РФ, СДЭК и
                др.).
              </li>
            </ul>
          </li>
          <li>
            <b>Ограничения возврата:</b>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>
                Не подлежат возврату товары из{' '}
                <a
                  href="https://www.consultant.ru/document/cons_doc_LAW_173292/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Перечня, утверждённого Постановлением Правительства РФ № 2463
                </a>{' '}
                (например, средства гигиены, индивидуального использования и др.).
              </li>
              <li>
                Товар с&nbsp;явными следами эксплуатации или без заводской упаковки к возврату не
                принимается, если нет производственного брака.
              </li>
            </ul>
          </li>
        </ol>
        <p>
          Возврат денежных средств производится только после получения и&nbsp;проверки возвращённого
          товара на складе. В случае вопросов — обращайтесь в&nbsp;нашу службу поддержки.
        </p>
        <div className="mt-6">
          <span className="block font-semibold mb-1">Контакты для возврата:</span>
          <ul className="ml-4">
            <li>
              Email:{' '}
              <a className="text-primary underline" href="mailto:support@ibr-market.ru">
                support@ibrmarket.ru
              </a>
            </li>
            <li>
              Форма обратной связи в разделе{' '}
              <a href="/contacts" className="text-primary underline">
                Контакты
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
