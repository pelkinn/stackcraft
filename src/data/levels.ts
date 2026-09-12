import { and, has, hasTag, isCat, isUsers, linked, minReplicas, not, reaches } from '../engine/graph'
import type { Graph, LevelDef } from '../types'
import { USERS_ID } from './blocks'

type RefNode = [id: string, blockId: string, replicas: number, x: number, y: number]

function ref(nodes: RefNode[], edges: [string, string][]): Graph {
  return {
    nodes: [
      { id: 'u', blockId: USERS_ID, replicas: 1, x: 0, y: 140 },
      ...nodes.map(([id, blockId, replicas, x, y]) => ({ id, blockId, replicas, x, y })),
    ],
    edges: edges.map(([source, target]) => ({ id: `${source}-${target}`, source, target })),
  }
}

const X = (col: number) => col * 230

const backend = isCat('backend')
const worker = hasTag('worker')
const api = and(backend, not(worker))

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Визитка',
    subtitle: 'Лендинг кофейни',
    brief:
      'Кофейня «Байт» хочет лендинг: меню, адрес, телефон. Трафик скромный, но заказчик ненавидит, когда сайт «думает». Динамики нет вообще.',
    traffic: { rps: 2000, readRatio: 0, staticShare: 1 },
    budget: 2,
    p95Ms: 100,
    fault: 'none',
    requirements: [
      {
        id: 'site',
        text: 'У кофейни есть сайт',
        explain: 'Посетители не добираются до страницы: нужен сам сайт и сервер, который его отдаёт.',
        check: (g) => reaches(g, isUsers, isCat('frontend')),
      },
      {
        id: 'geo',
        text: 'Страница открывается мгновенно в любом городе',
        explain: 'Один сервер далеко от половины посетителей. Статику раздают с узлов рядом с пользователем — это CDN.',
        check: (g) => linked(g, isUsers, hasTag('cdn')) && reaches(g, hasTag('cdn'), isCat('frontend')),
      },
    ],
    reference: ref([['cdn', 'inf-cdn', 1, X(1), 140], ['fe', 'fe-static', 1, X(2), 140]], [['u', 'cdn'], ['cdn', 'fe']]),
  },
  {
    id: 2,
    title: 'Интернет-магазин',
    subtitle: 'Первые заказы',
    brief:
      'Магазин носков «Пятка». Каталог, корзина, заказы. Данные надо где-то хранить, а фронт должен откуда-то их брать.',
    traffic: { rps: 400, readRatio: 0.8, staticShare: 0.5 },
    budget: 4,
    p95Ms: 300,
    fault: 'none',
    requirements: [
      {
        id: 'shop',
        text: 'Покупатель видит каталог и оформляет заказ',
        explain: 'Страница есть, но каталог и корзину кто-то должен обрабатывать на сервере.',
        check: (g) => reaches(g, isUsers, isCat('frontend')) && reaches(g, isCat('frontend'), backend),
      },
      {
        id: 'persist',
        text: 'Заказы не пропадают после перезапуска сервера',
        explain: 'Сервер держит данные в памяти — после рестарта всё исчезнет. Их нужно где-то хранить.',
        check: (g) => linked(g, backend, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['web', 'inf-lb', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['be', 'be-node', 1, X(3), 140],
        ['db', 'db-pg', 1, X(4), 140],
      ],
      [['u', 'web'], ['web', 'fe'], ['fe', 'be'], ['be', 'db']],
    ),
  },
  {
    id: 3,
    title: 'Чёрная пятница',
    subtitle: 'Трафик ×10',
    brief:
      '«Пятка» запускает распродажу: трафик ×10, и почти все только смотрят каталог. Прошлый год сайт лёг в 00:01. Второго шанса не будет.',
    traffic: { rps: 400, readRatio: 0.9, staticShare: 0.6, spike: 10 },
    budget: 10,
    p95Ms: 400,
    fault: 'none',
    requirements: [
      {
        id: 'shop',
        text: 'Магазин работает: каталог, корзина, заказы',
        explain: 'Покупатели не доходят до сервера, который обрабатывает заказы.',
        check: (g) => reaches(g, isUsers, backend),
      },
      {
        id: 'persist',
        text: 'Ни один заказ распродажи не потерян',
        explain: 'Заказы нужно сохранять в надёжное хранилище, а не держать в памяти сервера.',
        check: (g) => linked(g, backend, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['lb', 'inf-lb', 1, X(3), 140],
        ['be', 'be-node', 5, X(4), 140],
        ['cache', 'cache-redis', 1, X(5), 40],
        ['db', 'db-pg', 1, X(5), 240],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'lb'], ['lb', 'be'], ['be', 'cache'], ['be', 'db']],
    ),
  },
  {
    id: 4,
    title: 'Медиа',
    subtitle: 'Контент и поисковики',
    brief:
      'Издание «Кремниевый вестник». 97% трафика — чтение статей, половина пользователей приходит из поиска. Маркетолог плачет: Google видит пустую страницу.',
    traffic: { rps: 3000, readRatio: 0.97, staticShare: 0.7 },
    budget: 10,
    p95Ms: 500,
    fault: 'none',
    requirements: [
      {
        id: 'seo',
        text: 'Поисковики видят текст статей',
        explain: 'SPA отдаёт пустой HTML, текст появляется только после JS. Поисковику нужна готовая страница с сервера.',
        check: (g) => reaches(g, isUsers, hasTag('ssr')),
      },
      {
        id: 'persist',
        text: 'Архив статей хранится надёжно',
        explain: 'Статьи должны лежать в базе данных, а не в памяти сервера.',
        check: (g) => linked(g, backend, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-nuxt', 3, X(2), 140],
        ['be', 'be-node', 3, X(3), 140],
        ['cache', 'cache-redis', 1, X(4), 40],
        ['db', 'db-pg', 1, X(4), 240],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'be'], ['be', 'cache'], ['be', 'db']],
    ),
  },
  {
    id: 5,
    title: 'Чат',
    subtitle: 'Реальное время',
    brief:
      'Мессенджер для геймеров «Тиммейт». Сообщения должны прилетать мгновенно, даже если собеседники подключены к разным серверам.',
    traffic: { rps: 3000, readRatio: 0.85, staticShare: 0.1 },
    budget: 7,
    p95Ms: 200,
    fault: 'none',
    requirements: [
      {
        id: 'realtime',
        text: 'Сообщения прилетают сами, без обновления страницы',
        explain: 'Обычный HTTP — это «спросил, получил ответ». Чтобы сервер сам толкал сообщения, нужно постоянное соединение.',
        check: (g) => reaches(g, isUsers, hasTag('websocket')),
      },
      {
        id: 'cross',
        text: 'Собеседники на разных серверах слышат друг друга',
        explain: 'Одного сервера соединений мало, а если их несколько, серверам нужен общий канал, через который они пересылают сообщения.',
        check: (g) => has(g, and(hasTag('websocket'), minReplicas(2))) && linked(g, hasTag('websocket'), hasTag('pubsub')),
      },
      {
        id: 'history',
        text: 'История переписки сохраняется',
        explain: 'Сервер, который держит соединения, должен куда-то записывать сообщения.',
        check: (g) => linked(g, hasTag('websocket'), isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['lb', 'inf-lb', 1, X(3), 140],
        ['ws', 'be-ws', 2, X(4), 140],
        ['ps', 'cache-redis', 1, X(5), 40],
        ['db', 'db-mongo', 1, X(5), 240],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'lb'], ['lb', 'ws'], ['ws', 'ps'], ['ws', 'db']],
    ),
  },
  {
    id: 6,
    title: 'Фотохостинг',
    subtitle: 'Тяжёлые загрузки',
    brief:
      'Сервис «Кадр»: люди грузят фото, мы делаем превью трёх размеров. Ресайз занимает секунды — пользователь не должен их ждать.',
    traffic: { rps: 1500, readRatio: 0.9, staticShare: 0.6 },
    budget: 7,
    p95Ms: 400,
    fault: 'none',
    requirements: [
      {
        id: 'files',
        text: 'Миллионы фото хранятся дёшево и надёжно',
        explain: 'Файлы в реляционной БД или на диске сервера — дорого и хрупко. Для них есть отдельный тип хранилищ.',
        check: (g) => linked(g, backend, isCat('storage')),
      },
      {
        id: 'async',
        text: 'Пользователь не ждёт, пока сделаются превью',
        explain: 'Ресайз занимает секунды. API должен принять фото, отложить задачу и сразу ответить, а обработку сделать кто-то другой.',
        check: (g) => linked(g, api, isCat('queue')) && linked(g, isCat('queue'), worker) && linked(g, worker, isCat('storage')),
      },
      {
        id: 'meta',
        text: 'Альбомы и подписи сохраняются',
        explain: 'Метаданные фото — обычные записи, им место в базе данных.',
        check: (g) => linked(g, api, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-vue', 1, X(2), 140],
        ['be', 'be-node', 2, X(3), 140],
        ['db', 'db-pg', 1, X(4), 40],
        ['q', 'q-rabbit', 1, X(4), 240],
        ['w', 'be-worker', 1, X(5), 240],
        ['s3', 'st-s3', 1, X(6), 240],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'be'], ['be', 'db'], ['be', 'q'], ['q', 'w'], ['w', 's3']],
    ),
  },
  {
    id: 7,
    title: 'Платежи',
    subtitle: 'Деньги и надёжность',
    brief:
      'Маркетплейс «Лавка». Платёжный провайдер отвечает по 400 мс и иногда падает. Упавший инстанс не должен ронять оплату. Проверим: будем гасить узлы по одному.',
    traffic: { rps: 800, readRatio: 0.7, staticShare: 0.5 },
    budget: 12,
    p95Ms: 300,
    fault: 'compute',
    requirements: [
      {
        id: 'pay',
        text: 'Медленный провайдер не тормозит сайт',
        explain: 'Если API ждёт провайдера в запросе, каждый клик «Оплатить» висит полсекунды и падает вместе с ним. Платёж нужно проводить в фоне.',
        check: (g) => linked(g, worker, hasTag('payments')) && !linked(g, api, hasTag('payments')),
      },
      {
        id: 'mail',
        text: 'Покупатель получает чек на почту',
        explain: 'Чек должен уходить после оплаты, не задерживая ответ покупателю.',
        check: (g) => reaches(g, isCat('queue'), hasTag('notify')),
      },
      {
        id: 'gate',
        text: 'Авторизация и лимиты запросов проверяются в одном месте',
        explain: 'Сейчас каждый сервис должен сам проверять токены и защищаться от флуда. Это делают на единой точке входа.',
        check: (g) => linked(g, hasTag('gateway'), backend),
      },
      {
        id: 'orders',
        text: 'Заказы сохраняются',
        explain: 'API должен записывать заказы в базу данных.',
        check: (g) => linked(g, api, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['gw', 'inf-gw', 2, X(3), 140],
        ['be', 'be-java', 2, X(4), 140],
        ['cache', 'cache-redis', 1, X(5), 0],
        ['db', 'db-pg', 1, X(5), 140],
        ['q', 'q-rabbit', 2, X(5), 280],
        ['w', 'be-worker', 2, X(6), 280],
        ['pay', 'ext-pay', 1, X(7), 200],
        ['mail', 'ext-mail', 1, X(7), 360],
      ],
      [
        ['u', 'cdn'], ['cdn', 'fe'], ['fe', 'gw'], ['gw', 'be'], ['be', 'cache'], ['be', 'db'], ['be', 'q'],
        ['q', 'w'], ['w', 'pay'], ['w', 'mail'], ['w', 'db'],
      ],
    ),
  },
  {
    id: 8,
    title: 'Поиск по каталогу',
    subtitle: 'Миллион товаров',
    brief:
      '«Лавка» выросла до миллиона товаров. LIKE по Postgres думает по 3 секунды и не прощает опечаток. Нужен нормальный поиск, и он должен знать о новых товарах.',
    traffic: { rps: 2000, readRatio: 0.9, staticShare: 0.5 },
    budget: 13,
    p95Ms: 300,
    fault: 'compute',
    requirements: [
      {
        id: 'search',
        text: 'Поиск быстрый и прощает опечатки',
        explain: 'SQL-запрос с LIKE не понимает морфологию и опечатки. Для полнотекстового поиска есть специальные движки.',
        check: (g) => linked(g, api, and(isCat('search'), not(hasTag('olap')))),
      },
      {
        id: 'fresh',
        text: 'Новый товар появляется в поиске без ручной переиндексации',
        explain: 'Поисковый индекс — копия данных. Изменения должны доезжать до него сами, не блокируя сохранение товара.',
        check: (g) => reaches(g, isCat('queue'), and(isCat('search'), not(hasTag('olap')))),
      },
      {
        id: 'truth',
        text: 'У каталога есть надёжный источник правды',
        explain: 'Поисковый движок может потерять индекс. Сами товары должны жить в базе данных.',
        check: (g) => linked(g, api, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['lb', 'inf-lb', 2, X(3), 140],
        ['be', 'be-go', 2, X(4), 140],
        ['cache', 'cache-redis', 1, X(5), 0],
        ['db', 'db-pg', 1, X(5), 120],
        ['es', 'search-es', 1, X(6), 200],
        ['q', 'q-rabbit', 2, X(5), 300],
        ['w', 'be-worker', 2, X(6), 360],
      ],
      [
        ['u', 'cdn'], ['cdn', 'fe'], ['fe', 'lb'], ['lb', 'be'], ['be', 'cache'], ['be', 'db'], ['be', 'es'],
        ['be', 'q'], ['q', 'w'], ['w', 'es'],
      ],
    ),
  },
  {
    id: 9,
    title: 'Ни одной точки отказа',
    subtitle: 'SLA 99,95%',
    brief:
      'Банк «Кубышка» переносит личный кабинет к нам. SLA 99,95%. Аудитор будет выдёргивать провода — включая базу данных и кеш.',
    traffic: { rps: 3000, readRatio: 0.9, staticShare: 0.5 },
    budget: 12,
    p95Ms: 300,
    fault: 'full',
    faultRequired: true,
    requirements: [
      {
        id: 'cabinet',
        text: 'Клиенты видят счета и историю операций',
        explain: 'Личный кабинет должен читать данные клиентов из базы через сервер.',
        check: (g) => reaches(g, isUsers, api) && linked(g, api, isCat('db')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['lb', 'inf-lb', 2, X(3), 140],
        ['be', 'be-go', 3, X(4), 140],
        ['cache', 'cache-redis', 2, X(5), 20],
        ['db', 'db-pg', 1, X(5), 200],
        ['rep', 'db-replica', 2, X(6), 200],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'lb'], ['lb', 'be'], ['be', 'cache'], ['be', 'db'], ['db', 'rep']],
    ),
  },
  {
    id: 10,
    title: 'Аналитика событий',
    subtitle: '10 000 событий в секунду',
    brief:
      'Трекер «Глаз»: 10 000 событий в секунду — клики, просмотры, скроллы. Продактам нужны дашборды за секунды по миллиардам строк, а Postgres уже задыхается.',
    traffic: { rps: 10000, readRatio: 0.05, staticShare: 0.2 },
    budget: 16,
    p95Ms: 250,
    fault: 'compute',
    requirements: [
      {
        id: 'buffer',
        text: 'События не теряются на пиках и при падении хранилища',
        explain: 'Если писать события прямо в хранилище, любой его сбой или пик — потерянные данные. Нужен буфер, из которого можно перечитать.',
        check: (g) => linked(g, api, hasTag('stream')),
      },
      {
        id: 'olap',
        text: 'Дашборды по миллиардам событий строятся за секунды',
        explain: 'Строчная БД сканирует миллиарды строк минутами. Для аналитики нужна колоночная база, куда события доезжают из потока.',
        check: (g) => reaches(g, hasTag('stream'), hasTag('olap')),
      },
    ],
    reference: ref(
      [
        ['cdn', 'inf-cdn', 1, X(1), 140],
        ['fe', 'fe-react', 1, X(2), 140],
        ['gw', 'inf-gw', 2, X(3), 140],
        ['be', 'be-go', 7, X(4), 140],
        ['db', 'db-pg', 1, X(5), 20],
        ['k', 'q-kafka', 2, X(5), 240],
        ['ch', 'olap-ch', 1, X(6), 240],
      ],
      [['u', 'cdn'], ['cdn', 'fe'], ['fe', 'gw'], ['gw', 'be'], ['be', 'db'], ['be', 'k'], ['k', 'ch']],
    ),
  },
]

export const LEVEL_MAP: Record<number, LevelDef> = Object.fromEntries(LEVELS.map((l) => [l.id, l]))

export function startGraph(): Graph {
  return { nodes: [{ id: 'u', blockId: USERS_ID, replicas: 1, x: 0, y: 140 }], edges: [] }
}
