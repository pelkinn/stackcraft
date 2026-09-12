import {
  siAkamai, siAlgolia, siAngular, siApachecassandra, siApachedruid, siApachekafka, siApachepulsar, siApollographql,
  siAstro, siBun, siCelery, siClickhouse, siCloudflare, siCockroachlabs, siDjango, siDotnet, siElasticsearch,
  siEnvoyproxy, siExpress, siFastapi, siFastify, siFastly, siGo, siHtml5, siKong, siKtor, siLaravel, siMailgun,
  siMariadb, siMeilisearch, siMinio, siMongodb, siMysql, siNatsdotio, siNeo4j, siNestjs, siNextdotjs, siNginx,
  siNuxt, siOpensearch, siPhoenixframework, siPostgresql, siRabbitmq, siReact, siRedis, siRemix, siRubyonrails,
  siRust, siScylladb, siSnowflake, siSocketdotio, siSpringboot, siStripe, siSupabase, siSvelte, siTraefikproxy,
  siVuedotjs,
} from 'simple-icons'

export interface Logo {
  /** path в viewBox 0 0 24 24 */
  path: string
  color: string
  /** true — логотип с fill, false — наш контурный глиф */
  brand: boolean
}

// Слишком тёмные брендовые цвета на синем чертеже не видны — осветляем.
function readable(hex: string): string {
  const n = parseInt(hex, 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return lum < 0.28 ? '#e8f1ff' : `#${hex}`
}

const brand = (icon: { path: string; hex: string }): Logo => ({ path: icon.path, color: readable(icon.hex), brand: true })
const glyph = (path: string, color: string): Logo => ({ path, color, brand: false })

// Контурные глифы для того, чего нет в simple-icons (stroke, 24×24).
const GLYPHS = {
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6',
  bucket: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6l1.8 13c.2 1.2 2.9 2 6.2 2s6-.8 6.2-2L20 6M6.5 12c1.5.7 3.4 1 5.5 1s4-.3 5.5-1',
  memcached: 'M4 20V6l4 6 4-6 4 6 4-6v14M4 20h16',
  worker: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  card: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zM2 10h20M6 15h4',
  mail: 'M3 6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6zM3 6l9 7 9-7',
}

export const LOGOS: Record<string, Logo> = {
  users: glyph(GLYPHS.users, '#e8f1ff'),
  'fe-static': brand(siHtml5),
  'fe-react': brand(siReact),
  'fe-vue': brand(siVuedotjs),
  'fe-next': brand(siNextdotjs),
  'fe-nuxt': brand(siNuxt),
  'be-php': brand(siLaravel),
  'be-node': brand(siNestjs),
  'be-go': brand(siGo),
  'be-python': brand(siDjango),
  'be-java': brand(siSpringboot),
  'be-ws': brand(siSocketdotio),
  'be-worker': glyph(GLYPHS.worker, '#7cffb2'),
  'db-pg': brand(siPostgresql),
  'db-mysql': brand(siMysql),
  'db-mongo': brand(siMongodb),
  'db-replica': brand(siPostgresql),
  'cache-redis': brand(siRedis),
  'cache-memcached': glyph(GLYPHS.memcached, '#8fd6c9'),
  'q-rabbit': brand(siRabbitmq),
  'q-kafka': brand(siApachekafka),
  'st-s3': glyph(GLYPHS.bucket, '#ff9f43'),
  'search-es': brand(siElasticsearch),
  'olap-ch': brand(siClickhouse),
  'inf-cdn': brand(siCloudflare),
  'inf-lb': brand(siNginx),
  'inf-gw': brand(siKong),
  'ext-pay': glyph(GLYPHS.card, '#ff8f5f'),
  'ext-mail': glyph(GLYPHS.mail, '#ff8f5f'),

  'fe-angular': brand(siAngular),
  'fe-svelte': brand(siSvelte),
  'fe-astro': brand(siAstro),
  'fe-remix': brand(siRemix),
  'be-celery': brand(siCelery),
  'be-express': brand(siExpress),
  'be-fastify': brand(siFastify),
  'be-bun': brand(siBun),
  'be-fastapi': brand(siFastapi),
  'be-dotnet': brand(siDotnet),
  'be-rails': brand(siRubyonrails),
  'be-rust': brand(siRust),
  'be-ktor': brand(siKtor),
  'be-phoenix': brand(siPhoenixframework),
  'db-mariadb': brand(siMariadb),
  'db-supabase': brand(siSupabase),
  'db-cockroach': brand(siCockroachlabs),
  'db-cassandra': brand(siApachecassandra),
  'db-scylla': brand(siScylladb),
  'db-neo4j': brand(siNeo4j),
  'q-nats': brand(siNatsdotio),
  'q-pulsar': brand(siApachepulsar),
  'st-minio': brand(siMinio),
  'search-meili': brand(siMeilisearch),
  'search-opensearch': brand(siOpensearch),
  'search-algolia': brand(siAlgolia),
  'olap-druid': brand(siApachedruid),
  'olap-snowflake': brand(siSnowflake),
  'inf-fastly': brand(siFastly),
  'inf-akamai': brand(siAkamai),
  'inf-traefik': brand(siTraefikproxy),
  'inf-envoy': brand(siEnvoyproxy),
  'inf-apollo': brand(siApollographql),
  'ext-stripe': brand(siStripe),
  'ext-mailgun': brand(siMailgun),
}
