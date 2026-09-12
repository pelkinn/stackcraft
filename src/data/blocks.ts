import type { BlockDef, Category } from '../types'

export const USERS_ID = 'users'

export const BLOCKS: BlockDef[] = [
  {
    id: USERS_ID, category: 'client', stack: 'Internet', label: 'Пользователи',
    description: 'Источник трафика. Ставится уровнем, удалить нельзя.',
    servers: 0, capacityRps: Infinity, baseLatencyMs: 20, tags: [], maxReplicas: 1,
  },

  // Frontend
  {
    id: 'fe-static', category: 'frontend', stack: 'HTML', label: 'Статичный сайт',
    description: 'Голый HTML/CSS без логики. Это файлы — отдаёт их Nginx или CDN.',
    servers: 0, capacityRps: Infinity, baseLatencyMs: 1, tags: ['static'], maxReplicas: 1,
  },
  {
    id: 'fe-react', category: 'frontend', stack: 'React', label: 'React SPA',
    description: 'SPA: рендер в браузере, поисковики видят пустую страницу. Это файлы — отдаёт их Nginx или CDN.',
    servers: 0, capacityRps: Infinity, baseLatencyMs: 1, tags: ['spa'], maxReplicas: 1,
  },
  {
    id: 'fe-vue', category: 'frontend', stack: 'Vue', label: 'Vue SPA',
    description: 'SPA на Vue 3, те же плюсы и минусы, что у React SPA. Файлы отдаёт Nginx или CDN.',
    servers: 0, capacityRps: Infinity, baseLatencyMs: 1, tags: ['spa'], maxReplicas: 1,
  },
  {
    id: 'fe-next', category: 'frontend', stack: 'Next.js', label: 'Next.js SSR',
    description: 'Серверный рендер React. Хорошо для SEO, но нужен Node-сервер.',
    servers: 1, capacityRps: 600, baseLatencyMs: 40, tags: ['ssr'], maxReplicas: 8,
  },
  {
    id: 'fe-nuxt', category: 'frontend', stack: 'Nuxt', label: 'Nuxt SSR',
    description: 'Серверный рендер Vue. SEO-friendly, гидрация на клиенте.',
    servers: 1, capacityRps: 600, baseLatencyMs: 40, tags: ['ssr'], maxReplicas: 8,
  },
  {
    id: 'fe-angular', category: 'frontend', stack: 'Angular', label: 'Angular SPA',
    description: 'Фреймворк «всё включено» для больших команд. SPA: файлы отдаёт Nginx или CDN.',
    servers: 0, capacityRps: Infinity, baseLatencyMs: 1, tags: ['spa'], maxReplicas: 1,
  },
  {
    id: 'fe-svelte', category: 'frontend', stack: 'SvelteKit', label: 'SvelteKit',
    description: 'Компилируемый фреймворк с SSR. Маленький бандл, лёгкий сервер.',
    servers: 1, capacityRps: 900, baseLatencyMs: 30, tags: ['ssr'], maxReplicas: 8,
  },
  {
    id: 'fe-astro', category: 'frontend', stack: 'Astro', label: 'Astro',
    description: 'Для контентных сайтов: HTML по умолчанию, JS только в «островах».',
    servers: 1, capacityRps: 1500, baseLatencyMs: 20, tags: ['ssr'], maxReplicas: 8,
  },
  {
    id: 'fe-remix', category: 'frontend', stack: 'Remix', label: 'Remix',
    description: 'SSR на React с загрузкой данных на сервере и прогрессивным улучшением.',
    servers: 1, capacityRps: 700, baseLatencyMs: 35, tags: ['ssr'], maxReplicas: 8,
  },

  // Backend
  {
    id: 'be-php', category: 'backend', stack: 'PHP', label: 'Laravel',
    description: 'Классика e-commerce. Дёшево в найме, умеренная производительность.',
    servers: 1, capacityRps: 300, baseLatencyMs: 60, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-node', category: 'backend', stack: 'Node.js', label: 'NestJS',
    description: 'Хорош на I/O-нагрузке, один язык с фронтом.',
    servers: 1, capacityRps: 500, baseLatencyMs: 40, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-go', category: 'backend', stack: 'Go', label: 'Go API',
    description: 'Быстрый и экономный по памяти. Дороже в разработке.',
    servers: 1, capacityRps: 1500, baseLatencyMs: 15, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-python', category: 'backend', stack: 'Python', label: 'Django',
    description: 'Быстрый старт, «батарейки в комплекте». Медленный под нагрузкой.',
    servers: 1, capacityRps: 250, baseLatencyMs: 70, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-java', category: 'backend', stack: 'Java', label: 'Spring Boot',
    description: 'Энтерпрайз, строгие транзакции. Прожорлив по памяти.',
    servers: 1, capacityRps: 1000, baseLatencyMs: 25, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-ws', category: 'backend', stack: 'Node.js', label: 'WebSocket-шлюз',
    description: 'Держит постоянные соединения. Между инстансами нужен pub/sub.',
    servers: 1, capacityRps: 2000, baseLatencyMs: 10, tags: ['websocket'], maxReplicas: 10,
  },
  {
    id: 'be-worker', category: 'backend', stack: 'Worker', label: 'Фоновый воркер',
    description: 'Разбирает задачи из очереди: ресайз, письма, синк индексов.',
    servers: 1, capacityRps: 400, baseLatencyMs: 200, tags: ['worker'], maxReplicas: 10,
  },
  {
    id: 'be-celery', category: 'backend', stack: 'Celery', label: 'Celery-воркер',
    description: 'Фоновые задачи в Python-мире. Ретраи и расписания из коробки.',
    servers: 1, capacityRps: 350, baseLatencyMs: 250, tags: ['worker'], maxReplicas: 10,
  },
  {
    id: 'be-express', category: 'backend', stack: 'Node.js', label: 'Express',
    description: 'Минималистичный и самый распространённый Node-фреймворк.',
    servers: 1, capacityRps: 600, baseLatencyMs: 35, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-fastify', category: 'backend', stack: 'Node.js', label: 'Fastify',
    description: 'Быстрый Node-фреймворк со схемами и низким оверхедом.',
    servers: 1, capacityRps: 900, baseLatencyMs: 25, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-bun', category: 'backend', stack: 'Bun', label: 'Bun + Hono',
    description: 'Быстрый JS-рантайм и лёгкий роутер. Молодая экосистема.',
    servers: 1, capacityRps: 1200, baseLatencyMs: 15, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-fastapi', category: 'backend', stack: 'Python', label: 'FastAPI',
    description: 'Асинхронный Python с типами и автодокой. Любим ML-командами.',
    servers: 1, capacityRps: 600, baseLatencyMs: 35, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-dotnet', category: 'backend', stack: '.NET', label: 'ASP.NET Core',
    description: 'Производительный и строгий. Стандарт в банках и энтерпрайзе.',
    servers: 1, capacityRps: 1400, baseLatencyMs: 18, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-rails', category: 'backend', stack: 'Ruby', label: 'Ruby on Rails',
    description: 'Максимальная скорость разработки. Под нагрузкой нужно много реплик.',
    servers: 1, capacityRps: 250, baseLatencyMs: 70, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-rust', category: 'backend', stack: 'Rust', label: 'Rust / Axum',
    description: 'Максимум rps на ядро и предсказуемая латентность. Долго писать.',
    servers: 1, capacityRps: 2500, baseLatencyMs: 8, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-ktor', category: 'backend', stack: 'Kotlin', label: 'Ktor',
    description: 'Kotlin на корутинах. JVM без тяжести Spring.',
    servers: 1, capacityRps: 1100, baseLatencyMs: 22, tags: [], maxReplicas: 10,
  },
  {
    id: 'be-phoenix', category: 'backend', stack: 'Elixir', label: 'Phoenix',
    description: 'Каналы и WebSocket из коробки: BEAM держит миллионы соединений.',
    servers: 1, capacityRps: 2500, baseLatencyMs: 10, tags: ['websocket'], maxReplicas: 10,
  },

  // DB
  {
    id: 'db-pg', category: 'db', stack: 'PostgreSQL', label: 'PostgreSQL',
    description: 'Надёжная реляционка, ACID, JSONB. Выбор по умолчанию.',
    servers: 1, capacityRps: 800, baseLatencyMs: 10, tags: [], maxReplicas: 1,
  },
  {
    id: 'db-mysql', category: 'db', stack: 'MySQL', label: 'MySQL',
    description: 'Популярна в PHP-мире. Простая репликация.',
    servers: 1, capacityRps: 800, baseLatencyMs: 10, tags: [], maxReplicas: 1,
  },
  {
    id: 'db-mongo', category: 'db', stack: 'MongoDB', label: 'MongoDB',
    description: 'Документная, гибкая схема. Слабее с транзакциями между документами.',
    servers: 1, capacityRps: 1000, baseLatencyMs: 8, tags: [], maxReplicas: 1,
  },
  {
    id: 'db-replica', category: 'db', stack: 'Replica', label: 'Read-реплика',
    description: 'Копия БД только для чтения. Разгружает мастер и страхует его.',
    servers: 1, capacityRps: 800, baseLatencyMs: 10, tags: ['replica'], maxReplicas: 5,
  },
  {
    id: 'db-mariadb', category: 'db', stack: 'MariaDB', label: 'MariaDB',
    description: 'Открытый форк MySQL, совместим по протоколу.',
    servers: 1, capacityRps: 800, baseLatencyMs: 10, tags: [], maxReplicas: 1,
  },
  {
    id: 'db-supabase', category: 'db', stack: 'Supabase', label: 'Supabase',
    description: 'Managed Postgres с auth и API. Быстрый старт, меньше контроля.',
    servers: 0, capacityRps: 500, baseLatencyMs: 15, tags: [], maxReplicas: 1,
  },
  {
    id: 'db-cockroach', category: 'db', stack: 'CockroachDB', label: 'CockroachDB',
    description: 'Распределённый SQL: узлы кластера страхуют друг друга. Дороже и медленнее на запись.',
    servers: 1, capacityRps: 1200, baseLatencyMs: 20, tags: [], maxReplicas: 5,
  },
  {
    id: 'db-cassandra', category: 'db', stack: 'Cassandra', label: 'Cassandra',
    description: 'Wide-column для огромных потоков записи. Без JOIN и транзакций.',
    servers: 1, capacityRps: 5000, baseLatencyMs: 6, tags: [], maxReplicas: 5,
  },
  {
    id: 'db-scylla', category: 'db', stack: 'ScyllaDB', label: 'ScyllaDB',
    description: 'Совместима с Cassandra, переписана на C++. Ещё быстрее, ещё дороже.',
    servers: 1, capacityRps: 8000, baseLatencyMs: 3, tags: [], maxReplicas: 5,
  },
  {
    id: 'db-neo4j', category: 'db', stack: 'Neo4j', label: 'Neo4j',
    description: 'Графовая БД: связи и рекомендации. Не для обычного CRUD.',
    servers: 1, capacityRps: 600, baseLatencyMs: 15, tags: [], maxReplicas: 1,
  },

  // Cache
  {
    id: 'cache-redis', category: 'cache', stack: 'Redis', label: 'Redis',
    description: 'Кеш в памяти + pub/sub. Снимает чтения с БД.',
    servers: 1, capacityRps: 20000, baseLatencyMs: 1, tags: ['pubsub'], maxReplicas: 3, hitRatio: 0.85,
  },
  {
    id: 'cache-memcached', category: 'cache', stack: 'Memcached', label: 'Memcached',
    description: 'Простой быстрый кеш. Без pub/sub и персистентности.',
    servers: 1, capacityRps: 25000, baseLatencyMs: 1, tags: [], maxReplicas: 3, hitRatio: 0.8,
  },

  // Queue
  {
    id: 'q-rabbit', category: 'queue', stack: 'RabbitMQ', label: 'RabbitMQ',
    description: 'Очередь задач с подтверждениями. Сглаживает пики записи.',
    servers: 1, capacityRps: 5000, baseLatencyMs: 3, tags: [], maxReplicas: 3,
  },
  {
    id: 'q-kafka', category: 'queue', stack: 'Kafka', label: 'Kafka',
    description: 'Лог событий, огромный throughput, повторное чтение.',
    servers: 1, capacityRps: 50000, baseLatencyMs: 5, tags: ['stream'], maxReplicas: 3,
  },
  {
    id: 'q-nats', category: 'queue', stack: 'NATS', label: 'NATS',
    description: 'Лёгкий брокер: pub/sub, request-reply, JetStream для персистентности.',
    servers: 1, capacityRps: 30000, baseLatencyMs: 2, tags: ['pubsub'], maxReplicas: 3,
  },
  {
    id: 'q-pulsar', category: 'queue', stack: 'Pulsar', label: 'Apache Pulsar',
    description: 'Лог событий с разделением хранения и брокеров, мульти-тенантность.',
    servers: 1, capacityRps: 40000, baseLatencyMs: 6, tags: ['stream'], maxReplicas: 3,
  },

  // Storage / Search / Analytics
  {
    id: 'st-s3', category: 'storage', stack: 'S3', label: 'Объектное хранилище',
    description: 'Файлы и картинки. Почти бесконечное и дешёвое.',
    servers: 0, capacityRps: 10000, baseLatencyMs: 30, tags: [], maxReplicas: 1,
  },
  {
    id: 'st-minio', category: 'storage', stack: 'MinIO', label: 'MinIO',
    description: 'S3-совместимое хранилище на своих серверах.',
    servers: 1, capacityRps: 5000, baseLatencyMs: 15, tags: [], maxReplicas: 4,
  },
  {
    id: 'search-es', category: 'search', stack: 'Elasticsearch', label: 'Elasticsearch',
    description: 'Полнотекстовый поиск, фасеты, опечатки.',
    servers: 1, capacityRps: 2000, baseLatencyMs: 20, tags: [], maxReplicas: 3,
  },
  {
    id: 'olap-ch', category: 'search', stack: 'ClickHouse', label: 'ClickHouse',
    description: 'Колоночная OLAP-база для аналитики на миллиардах строк.',
    servers: 1, capacityRps: 30000, baseLatencyMs: 50, tags: ['olap'], maxReplicas: 3,
  },
  {
    id: 'search-meili', category: 'search', stack: 'Meilisearch', label: 'Meilisearch',
    description: 'Простой поиск с опечатками «из коробки». Один узел, быстрый старт.',
    servers: 1, capacityRps: 1500, baseLatencyMs: 10, tags: [], maxReplicas: 1,
  },
  {
    id: 'search-opensearch', category: 'search', stack: 'OpenSearch', label: 'OpenSearch',
    description: 'Открытый форк Elasticsearch от AWS.',
    servers: 1, capacityRps: 2000, baseLatencyMs: 20, tags: [], maxReplicas: 3,
  },
  {
    id: 'search-algolia', category: 'search', stack: 'Algolia', label: 'Algolia',
    description: 'Поиск как сервис: мгновенно и без админства, но платишь за запросы.',
    servers: 0, capacityRps: 5000, baseLatencyMs: 15, tags: [], maxReplicas: 1,
  },
  {
    id: 'olap-druid', category: 'search', stack: 'Druid', label: 'Apache Druid',
    description: 'Real-time OLAP: дашборды по свежим событиям за доли секунды.',
    servers: 1, capacityRps: 25000, baseLatencyMs: 40, tags: ['olap'], maxReplicas: 3,
  },
  {
    id: 'olap-snowflake', category: 'search', stack: 'Snowflake', label: 'Snowflake',
    description: 'Облачное хранилище данных. Мощно, но запросы медленные и дорогие.',
    servers: 0, capacityRps: 20000, baseLatencyMs: 300, tags: ['olap'], maxReplicas: 1,
  },

  // Infra
  {
    id: 'inf-cdn', category: 'infra', stack: 'CDN', label: 'CDN',
    description: 'Раздаёт статику с узлов рядом с пользователем.',
    servers: 0, capacityRps: 100000, baseLatencyMs: 5, tags: ['cdn'], maxReplicas: 1,
  },
  {
    id: 'inf-lb', category: 'infra', stack: 'Веб-сервер', label: 'Nginx',
    description: 'Веб-сервер и балансировщик: отдаёт статику и раскидывает запросы по репликам.',
    servers: 1, capacityRps: 30000, baseLatencyMs: 2, tags: ['lb', 'webserver'], maxReplicas: 2,
  },
  {
    id: 'inf-gw', category: 'infra', stack: 'API Gateway', label: 'API Gateway',
    description: 'Единая точка входа: авторизация, rate limit, маршрутизация.',
    servers: 1, capacityRps: 20000, baseLatencyMs: 4, tags: ['gateway', 'lb'], maxReplicas: 2,
  },
  {
    id: 'inf-fastly', category: 'infra', stack: 'Fastly', label: 'Fastly',
    description: 'CDN с edge-логикой и мгновенной инвалидацией кеша.',
    servers: 0, capacityRps: 100000, baseLatencyMs: 4, tags: ['cdn'], maxReplicas: 1,
  },
  {
    id: 'inf-akamai', category: 'infra', stack: 'Akamai', label: 'Akamai',
    description: 'Крупнейшая CDN-сеть. Для энтерпрайза и медиа.',
    servers: 0, capacityRps: 150000, baseLatencyMs: 4, tags: ['cdn'], maxReplicas: 1,
  },
  {
    id: 'inf-traefik', category: 'infra', stack: 'Traefik', label: 'Traefik',
    description: 'Балансировщик для контейнеров: сам находит сервисы, сам выпускает TLS.',
    servers: 1, capacityRps: 20000, baseLatencyMs: 3, tags: ['lb'], maxReplicas: 2,
  },
  {
    id: 'inf-envoy', category: 'infra', stack: 'Envoy', label: 'Envoy',
    description: 'L7-прокси для микросервисов: ретраи, circuit breaker, gRPC.',
    servers: 1, capacityRps: 40000, baseLatencyMs: 2, tags: ['lb', 'gateway'], maxReplicas: 2,
  },
  {
    id: 'inf-apollo', category: 'infra', stack: 'GraphQL', label: 'Apollo Router',
    description: 'GraphQL-шлюз: один запрос клиента собирает данные из нескольких сервисов.',
    servers: 1, capacityRps: 8000, baseLatencyMs: 8, tags: ['gateway', 'lb'], maxReplicas: 2,
  },

  // External
  {
    id: 'ext-pay', category: 'external', stack: 'ЮKassa', label: 'Платёжный провайдер',
    description: 'Внешний API. Бывает медленным и падает — нужны ретраи.',
    servers: 0, capacityRps: 200, baseLatencyMs: 400, tags: ['payments'], maxReplicas: 1,
  },
  {
    id: 'ext-mail', category: 'external', stack: 'SMTP', label: 'Email / SMS',
    description: 'Рассылка писем и уведомлений. Всегда асинхронно.',
    servers: 0, capacityRps: 500, baseLatencyMs: 800, tags: ['notify'], maxReplicas: 1,
  },
  {
    id: 'ext-stripe', category: 'external', stack: 'Stripe', label: 'Stripe',
    description: 'Международные платежи с хорошим API и вебхуками.',
    servers: 0, capacityRps: 500, baseLatencyMs: 300, tags: ['payments'], maxReplicas: 1,
  },
  {
    id: 'ext-mailgun', category: 'external', stack: 'Mailgun', label: 'Mailgun',
    description: 'Транзакционные письма через API.',
    servers: 0, capacityRps: 1000, baseLatencyMs: 600, tags: ['notify'], maxReplicas: 1,
  },
]

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map((b) => [b.id, b]))

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  client: { label: 'Клиент', color: '#e8f1ff' },
  frontend: { label: 'Фронт', color: '#4fd1ff' },
  backend: { label: 'Бэк', color: '#7cffb2' },
  db: { label: 'БД', color: '#ffb547' },
  cache: { label: 'Кеш', color: '#ff6b9a' },
  queue: { label: 'Очереди', color: '#c792ff' },
  storage: { label: 'Хранилище', color: '#8fb4ff' },
  search: { label: 'Поиск / OLAP', color: '#ffe36b' },
  infra: { label: 'Инфра', color: '#5fffe0' },
  external: { label: 'Внешнее', color: '#ff8f5f' },
}

export const PALETTE_ORDER: Category[] = [
  'frontend', 'backend', 'db', 'cache', 'queue', 'storage', 'search', 'infra', 'external',
]
