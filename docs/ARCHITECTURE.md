# Architecture

## High-level схема

```
┌────────────────────────────────────────────────────────┐
│                       Browser                          │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   Public site (SSR)  │    │   Admin SPA          │  │
│  │   /, /menu, /book    │    │   /admin/*           │  │
│  └─────────┬────────────┘    └─────────┬────────────┘  │
└────────────┼─────────────────────────────┼─────────────┘
             │ HTTP / SSE / WS (finale)    │
             ▼                             ▼
   ┌────────────────────────────────────────────────┐
   │   Angular SSR server (Node)                    │
   │   apps/web (one Angular app, two route trees)  │
   └────────────────────────┬───────────────────────┘
                            │ HTTP (server-to-server fetch)
                            ▼
                  ┌─────────────────────┐
                  │   NestJS API        │
                  │   apps/api          │
                  │   - Auth (JWT)      │
                  │   - REST            │
                  │   - SSE endpoints   │
                  │   - WS gateway      │
                  └──────────┬──────────┘
                             │ Mongoose
                             ▼
                  ┌─────────────────────┐
                  │   MongoDB Atlas M0  │
                  └─────────────────────┘
```

**Ключевое решение:** один Angular-app `apps/web` обслуживает обе поверхности — публичную (с SSR) и админскую (lazy-loaded SPA-роуты). Не два разных приложения. Причины:
- Общие компоненты UI (header, theming, i18n).
- Один SSR-сервер — проще деплой.
- `/admin/*` через `loadChildren` + `canMatch(adminGuard)` — chunk не попадёт в guest-bundle (`canMatch` блокирует matching, что эквивалентно тому, что роута нет — chunk не грузится).

## Nx-монорепо: структура

```
restaurant-platform/
├── apps/
│   ├── web/                       # Angular 20 SSR
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── public/        # guest-facing routes
│   │   │   │   ├── account/       # customer routes
│   │   │   │   ├── admin/         # admin routes (lazy)
│   │   │   │   ├── shared/        # app-level shared
│   │   │   │   └── app.routes.ts
│   │   │   ├── main.ts
│   │   │   └── main.server.ts
│   │   ├── server.ts              # Express SSR entry
│   │   └── project.json
│   ├── web-e2e/                   # Playwright e2e
│   └── api/                       # NestJS
│       ├── src/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── menu/
│       │   ├── orders/
│       │   ├── bookings/
│       │   ├── analytics/
│       │   ├── realtime/          # SSE + WS gateway
│       │   ├── common/            # guards, interceptors, filters
│       │   ├── config/
│       │   └── main.ts
│       └── project.json
├── libs/
│   ├── shared-types/              # TS interfaces, общие фронт+бэк
│   ├── shared-dto/                # Zod schemas + типы из них
│   ├── shared-constants/          # Order statuses, roles, etc.
│   ├── ui/                        # Angular UI primitives (Button, Card, Skeleton)
│   ├── feature-menu/              # menu feature module (Angular)
│   ├── feature-cart/              # cart store + components
│   ├── feature-orders/            # orders feature
│   ├── feature-admin-dashboard/   # admin dashboard feature
│   ├── data-access/               # HTTP services
│   ├── state/                     # Signal Stores (CartStore, AuthStore, ...)
│   └── state-features/            # custom @ngrx/signals features (withStorage и т.п.)
├── tools/
│   └── generators/                # custom Nx generators
├── docs/
│   ├── PROJECT-VISION.md
│   ├── USE-CASES.md
│   ├── FEATURE-MAP.md
│   ├── ARCHITECTURE.md            # этот файл
│   └── ROADMAP.md
├── .github/workflows/
│   └── ci.yml
├── nx.json
├── package.json
├── tsconfig.base.json
├── docker/
│   ├── web.Dockerfile
│   └── api.Dockerfile
└── render.yaml                    # Render blueprint
```

### Правила зависимостей между libs

Жёсткие правила Nx (`@nx/enforce-module-boundaries`):

| От → к | Разрешено? |
|---|---|
| `apps/*` → `libs/feature-*` | ✅ |
| `libs/feature-*` → `libs/data-access` | ✅ |
| `libs/feature-*` → `libs/ui` | ✅ |
| `libs/feature-*` → `libs/shared-*` | ✅ |
| `libs/data-access` → `libs/shared-*` | ✅ |
| `libs/ui` → ничего | только `shared-types/constants` |
| `libs/feature-X` → `libs/feature-Y` | ❌ запрещено, фичи независимы |
| `apps/api` → `libs/shared-*` | ✅ |
| `apps/api` → `libs/ui` или `libs/feature-*` | ❌ |

Тэги в `nx.json`:
- `scope:shared`, `scope:web`, `scope:api`
- `type:app`, `type:feature`, `type:data-access`, `type:ui`, `type:util`

## Frontend архитектура

### Bootstrap
```ts
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideClientHydration(withIncrementalHydration(), withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
    provideAppInitializer(() => inject(ConfigService).load()),
    provideAnimationsAsync(),
    ...materialProviders,
  ]
});
```

### Routing
```
/                            → PublicHomeComponent          [SSR]
/menu                        → PublicMenuComponent          [SSR + Incremental Hydration]
/about                       → AboutComponent               [SSR, JSON-LD]
/auth/login                  → LoginComponent
/auth/register               → RegisterComponent
/account/orders              → lazy: AccountOrdersComponent [canActivate]
/account/orders/:id          → lazy: OrderDetailComponent   [SSE подписка]
/checkout                    → lazy: CheckoutComponent      [canActivate, canDeactivate]
/admin                       → lazy: loadChildren admin.routes  [canMatch(admin)]
  /dashboard                 → AdminDashboardComponent
  /orders                    → AdminOrdersComponent          [SSE доска]
  /menu                      → AdminMenuComponent
  /menu/:id                  → AdminDishEditComponent        [resolve + canDeactivate]
  /bookings                  → AdminBookingsComponent
  /users                     → AdminUsersComponent
```

### State management

**Подход:** комбинируем два уровня.

**Уровень 1 — голые сигналы для локального состояния компонентов** (UI-флаги, локальные toggle, временные значения).

**Уровень 2 — `@ngrx/signals` Signal Store для глобальных stores** (Cart, Auth, Menu, Orders). Это даёт:
- DevTools (Redux DevTools умеет показывать Signal Store),
- единые конвенции `withState/withComputed/withMethods/withHooks`,
- готовые плагины: `withEntities` для коллекций, `rxMethod` для RxJS-моста.

Без классического NgRx (actions/reducers/effects) — он избыточен для нашего скоупа.

Пример `CartStore` на Signal Store:

```ts
import { signalStore, withState, withComputed, withMethods, withHooks } from '@ngrx/signals';

interface CartState {
  items: CartItem[];
  status: 'idle' | 'loading' | 'error';
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState<CartState>({ items: [], status: 'idle' }),
  withStorage('cart'),  // кастомная feature для localStorage (SSR-safe)
  withComputed(({ items }) => ({
    totalCount: computed(() => items().reduce((s, i) => s + i.count, 0)),
    totalPrice: computed(() => items().reduce((s, i) => s + i.price * i.count, 0)),
    isEmpty: computed(() => items().length === 0),
  })),
  withMethods((store) => ({
    add(item: CartItem) {
      patchState(store, (s) => ({ items: [...s.items, item] }));
    },
    remove(id: string) {
      patchState(store, (s) => ({ items: s.items.filter(i => i.id !== id) }));
    },
    clear() {
      patchState(store, { items: [] });
    },
  })),
);
```

`AuthStore` — аналогично, но с `withMethods` для login/logout/refresh и `rxMethod` для авто-refresh таймера.

`OrdersStore` (админский) — использует `withEntities` для нормализованного хранения заказов + `rxMethod` для подписки на SSE-стрим.

Cross-store derivations — через `computed` в потребителях, инжектящих оба store.

#### Кастомная Signal Store feature: `withStorage`

Для persistence корзины в localStorage пишем переиспользуемую feature (а не повторяем `effect()` в каждом store):

```ts
export function withStorage(key: string) {
  return signalStoreFeature(
    withHooks({
      onInit(store) {
        const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
        if (!isBrowser) return;  // SSR-safe

        const saved = localStorage.getItem(key);
        if (saved) patchState(store, JSON.parse(saved));

        effect(() => {
          const snapshot = getState(store);
          localStorage.setItem(key, JSON.stringify(snapshot));
        });
      },
    })
  );
}
```

Используется в любом store через `withStorage('storage-key')`.

### SSR-safe код

- DI-токен `WINDOW`, `LOCAL_STORAGE` с factory, возвращающим `null` на сервере.
- `isPlatformBrowser(platformId)` проверки только там, где иначе никак.
- `EventSource` создаётся в `afterNextRender(() => ...)` — на сервере не работает.

## Backend архитектура (NestJS)

### Модули

```
AppModule
├── ConfigModule (global)
├── MongooseModule.forRootAsync(...)
├── AuthModule          (JWT, refresh tokens, RolesGuard)
├── UsersModule
├── MenuModule          (CRUD блюд, поиск)
├── OrdersModule        (CRUD + status flow + SSE source)
├── BookingsModule
├── AnalyticsModule     (aggregation pipelines)
├── RealtimeModule      (SSE controllers + WS gateway finale)
└── HealthModule        (для Render healthcheck)
```

### Auth flow

1. **Login**: POST `/auth/login` → возвращает `{ accessToken }` в body + ставит **refresh** в httpOnly cookie.
2. **Authorized requests**: Authorization header `Bearer <accessToken>`.
3. **Refresh**: POST `/auth/refresh` берёт refresh из cookie → выдаёт новые access + refresh (rotation).
4. **Logout**: POST `/auth/logout` → стирает cookie, инвалидирует refresh.

Interceptor на фронте:
- На 401 → пытается `/auth/refresh` → ретраит запрос. При втором 401 → редирект на `/auth/login`.

### Status flow заказа

```
pending → accepted → preparing → ready → completed
   │           │           │
   ▼           ▼           ▼
cancelled  cancelled  cancelled
```

Каждое изменение пушится через `EventEmitter2` → SSE subscriber для user (по `userId`) и для admin (broadcast).

### SSE endpoints

```ts
@Sse('orders/:id/stream')
streamOrderStatus(@Param('id') id: string): Observable<MessageEvent> {
  return this.events.pipe(
    filter(e => e.orderId === id),
    map(e => ({ data: { status: e.status, at: e.at } } as MessageEvent))
  );
}

@Sse('admin/orders/stream')
@Roles('admin')
streamAllOrders(): Observable<MessageEvent> { /* ... */ }
```

На фронте — обёртка `SseClient`:
```ts
class SseClient<T> {
  private es?: EventSource;
  readonly data = signal<T | null>(null);
  readonly connected = signal(false);

  connect(url: string) {
    this.es = new EventSource(url, { withCredentials: true });
    this.es.onmessage = (e) => this.data.set(JSON.parse(e.data));
    this.es.onopen = () => this.connected.set(true);
    this.es.onerror = () => this.connected.set(false);  // авто-reconnect
  }
  disconnect() { this.es?.close(); }
}
```

Использование: `inject(DestroyRef).onDestroy(() => sse.disconnect())`.

## Mongo schema

### Collections

**`users`**
```ts
{
  _id, email (unique), passwordHash, role: 'customer' | 'admin',
  name, phone?, createdAt, refreshTokenHash?
}
```

**`dishes`**
```ts
{
  _id, name, description, price, imageUrl,
  category: 'salad' | 'main' | 'dessert' | 'drink',
  sideDishes: [{ _id, name, type, extraPrice }],
  allergens: string[],
  isArchived: boolean,
  createdAt, updatedAt
}
```

**`orders`**
```ts
{
  _id, userId, items: [{ dishId, name, price, count, sideDishes: [...] }],
  total, status: OrderStatus,
  pickupTime, contactPhone,
  paymentStatus: 'mock-paid',
  statusHistory: [{ status, at }],
  createdAt
}
```

Индексы:
- `orders.userId`, `orders.status`, `orders.createdAt` (compound для admin-listing)
- `dishes.category`, `dishes.isArchived`
- text-индекс на `dishes.name` для поиска (G-3)

**`bookings`**
```ts
{
  _id, userId, datetime, guestCount, status: 'pending'|'confirmed'|'cancelled',
  notes?, createdAt
}
```

### Aggregations для аналитики (A-5)

- **Выручка по дням**: `$match { status: completed }` → `$group { _id: $dateToString, sum: $sum: $total }`.
- **Топ блюд**: `$unwind items` → `$group { _id: items.dishId, count: $sum }` → `$sort` → `$limit 10`.

## Shared types contract

`libs/shared-types/src/index.ts`:
```ts
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export interface OrderDTO { /* ... */ }
export interface DishDTO { /* ... */ }
// ...
```

`libs/shared-dto/src/index.ts`:
```ts
import { z } from 'zod';
export const CreateOrderSchema = z.object({ /* ... */ });
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
```

Используется и Nest (валидация через ZodValidationPipe), и Angular (типизация HTTP-сервисов, можно валидировать ответы).

## Deployment

### Render

`render.yaml` (Infrastructure as Code):

```yaml
services:
  - type: web
    name: restaurant-api
    env: docker
    dockerfilePath: ./docker/api.Dockerfile
    healthCheckPath: /api/health
    envVars:
      - key: MONGO_URI
        sync: false   # из Render dashboard
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production

  - type: web
    name: restaurant-web
    env: docker
    dockerfilePath: ./docker/web.Dockerfile
    envVars:
      - key: API_URL
        fromService:
          type: web
          name: restaurant-api
          property: host
```

### Docker

`docker/api.Dockerfile`:
- multi-stage: builder (`nx build api --prod`) → runtime (Node 22 alpine, `dist/apps/api`).

`docker/web.Dockerfile`:
- multi-stage: builder (`nx build web --configuration=production` + `nx run web:server`) → runtime запускает SSR-сервер.

### MongoDB Atlas

- Free M0 cluster, IP allowlist `0.0.0.0/0` (Render IP'ы динамичны).
- Database user с правами на одну БД.
- Connection string в `MONGO_URI` env-переменной на Render.

### CI (GitHub Actions)

`.github/workflows/ci.yml`:
- Trigger: pull_request + push на main.
- Jobs: `lint` (`nx affected -t lint`), `test` (`nx affected -t test`), `build` (`nx affected -t build`).
- Render авто-деплоит main при пуше (через GitHub integration, не через Actions).

## Что НЕ строим

- Никакого Redis/Kafka — `EventEmitter2` в памяти процесса. Один инстанс на Render = OK для pet.
- Никакого Nginx — Render сам терминирует TLS.
- Никаких миграций Mongo — Mongoose schemas + ручные индексы.
- Никаких feature flags — все фичи всегда on.

## Открытые вопросы

1. **Изображения блюд**: на старте — просто `imageUrl` (картинки лежат в `/assets` или Cloudinary free tier). Возможно поднимем до загрузки в S3, если будет время.
2. **Sitemap / robots.txt**: добавим в SHOULD-итерацию вместе с SSR-полировкой.
3. **Rate limiting**: `@nestjs/throttler` — добавим после auth, до публичного деплоя.

Эти вопросы зафиксированы здесь, чтобы не забыть; ответы выбираем по ходу разработки.
