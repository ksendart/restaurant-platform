# Roadmap

## Принципы

1. **Сначала скелет — потом фичи**: первая итерация поднимает каркас всех частей системы (фронт + бэк + БД + один сквозной endpoint), даже самый примитивный. Цель — увидеть, что pipeline вообще работает.
2. **End-to-end vertical slices**: каждая последующая итерация добавляет одну продуктовую фичу **сквозно** — от Mongo-схемы до UI. Не «месяц на бэк, потом месяц на фронт».
3. **Демо в конце каждой итерации**: каждая итерация заканчивается чем-то, что можно показать. Если фича не работает end-to-end — итерация не закрыта.
4. **WS — в самом конце**: SSE покрывает все real-time сценарии MVP. WebSocket добавляется в финальной итерации специально, чтобы продемонстрировать двунаправленный канал.
5. **Никаких преждевременных оптимизаций**: индексы Mongo добавляем при появлении медленных запросов; lazy routes — когда initial bundle становится тяжёлым; кэширование — по факту, не на всякий случай.
6. **Каждая итерация — это PR в main**: даже если работаем без ревью, дисциплина PR полезна (CI отрабатывает, история чистая).
7. **Формат commit message**: `Iteration <N> - <Title>` (дефис, без двоеточия). Например: `Iteration 0 - Bootstrap monorepo`, `Iteration 1 - Public menu with SSR`. Тело коммита — список изменений в bullet'ах.

## Оценка времени

При **10 ч/неделю**, без жёсткого дедлайна. Каждая итерация — это **подсказка о порядке**, а не строгий план; реальное распределение по неделям корректируем по факту.

---

## Iteration 0 — Bootstrap (≈ 1 неделя)

**Цель:** монорепо с пустыми app и сквозным «hello world» от Mongo до фронта.

### Шаги
1. `npx create-nx-workspace restaurant-platform --preset=ts` → выбрать пустой preset.
2. `nx g @nx/angular:app web --ssr --standalone --routing --style=scss`.
3. `nx g @nx/nest:app api`.
4. `nx g @nx/js:lib shared-types --buildable`.
5. `nx g @nx/js:lib state` и `nx g @nx/js:lib state-features` — пустые библиотеки под будущие Signal Stores и кастомные features.
6. `npm i @ngrx/signals` в корень workspace (нужен с Iteration 2, но удобнее поставить сразу, чтобы зафиксировать версию).
7. Настроить `tsconfig.base.json` paths: `@restaurant/shared-types` → `libs/shared-types/src/index.ts`, `@restaurant/state` → `libs/state/src/index.ts`, `@restaurant/state-features` → `libs/state-features/src/index.ts`.
8. `apps/api`: один endpoint `GET /api/ping` → возвращает `{ pong: true, time: Date.now() }`.
9. `apps/web`: главная страница делает `fetch('/api/ping')` и выводит время; работает и в SSR (через `HttpClient` + proxy).
10. Поднять локальный Mongo через Docker compose (`docker-compose.yml` в корне).
11. Подключить Mongoose к Nest, создать тестовую схему `Ping` с counter — каждый `/api/ping` инкрементит.
12. ESLint + Prettier настроены через Nx, `nx affected -t lint` работает.
13. Установить Redux DevTools extension в браузер (понадобится с Iteration 2 для инспекции Signal Store).
14. Husky + lint-staged (опционально, но дешёво).

### Demo
- `nx serve web` + `nx serve api` локально.
- Открыть `http://localhost:4200` → видна цифра, обновляется при перезагрузке.

### Acceptance
- [ ] `nx affected -t lint test build` проходит локально.
- [ ] SSR работает: `curl http://localhost:4200` отдаёт HTML с актуальной цифрой.
- [ ] Mongo поднимается через `docker-compose up`.

---

## Iteration 1 — Публичное меню с SSR (≈ 1.5 недели)

**Цель:** Гость может зайти на `/menu` и увидеть меню, отрендеренное на сервере. Покрывает G-1, G-2.

### Шаги
1. Установить **Husky** + **lint-staged**: pre-commit hook прогоняет `lint` и `prettier --write` на staged-файлах. Цель — больше никаких рукопашных `nx lint` перед коммитом, и никаких форматных артефактов в истории.
2. Mongoose схема `Dish` + сидер с 10-15 тестовыми блюдами.
3. Nest endpoints: `GET /api/menu` (все блюда, group by category), `GET /api/menu/:id`.
4. `shared-types`: `DishDTO`, `Category`.
5. `libs/data-access/menu`: Angular `MenuService` через `httpResource`.
6. `libs/ui`: примитивы `<r-card>`, `<r-skeleton>`, `<r-price>`.
7. `libs/feature-menu`: `MenuPage` компонент → группировка по категориям через `@for`, фильтр через `@switch`.
8. Подключить **Angular Material**, выбрать theme tokens (light/dark CSS variables).
9. SSR: убедиться, что `httpResource` работает в SSR (использует `HttpClient` + `withFetch()`).
10. `provideClientHydration(withIncrementalHydration(), withEventReplay())`.
11. Карточки ниже первого экрана: `@defer (on viewport) { <dish-card/> } @placeholder { <r-skeleton/> }`.
12. Адаптивная сетка: 3 кол. desktop / 2 tablet / 1 mobile.
13. Lighthouse: добиться SEO ≥ 95, Performance ≥ 85 на `/menu`.

### Demo
- `/menu` рендерится на сервере, фильтр по категориям работает, скелетоны при загрузке, ниже первого экрана — defer-блоки.

### Acceptance
- [ ] Disabled JS → меню всё ещё видно (SSR).
- [ ] Network throttling Slow 3G → skeleton-карточки появляются до контента.
- [ ] Lighthouse Performance ≥ 85.
- [ ] Pre-commit hook реально срабатывает: умышленно сломать форматирование → `git commit` падает (или авто-фиксит staged).

---

## Iteration 2 — Корзина + Auth (≈ 2 недели)

**Цель:** Гость добавляет блюда в корзину, регистрируется, оформляет заказ-заглушку. Покрывает G-3, G-4, G-5, C-1.

**State management в этой итерации:** появляются первые глобальные stores — пишем их сразу через `@ngrx/signals` `signalStore`. Это «point of entry» в Signal Store для всего проекта.

### Шаги
1. Mongoose схема `User` (email, passwordHash, role, refreshTokenHash).
2. Nest `AuthModule`: register / login / refresh / logout, JWT access (15 мин) + refresh (7 дней) в httpOnly cookie.
3. `RolesGuard`, `JwtAuthGuard` в Nest.
4. `libs/state-features`: реализовать кастомную feature `withStorage(key)` для SSR-safe localStorage persist (см. ARCHITECTURE.md).
5. `libs/state`: реализовать **`AuthStore`** на `signalStore` с `withState/withMethods/withHooks`. Методы: `login`, `logout`, `refresh`, `register`. Через `rxMethod` сделать авто-refresh access-токена за 1 мин до истечения.
6. `authInterceptor` (Bearer + refresh on 401), `errorInterceptor` — используют `AuthStore.refresh()`.
7. `LoginComponent` / `RegisterComponent` — Reactive Forms + Material; вызывают методы `AuthStore`.
8. `libs/state`: реализовать **`CartStore`** на `signalStore` с `withState`, `withStorage('cart')`, `withComputed` (totalCount, totalPrice, isEmpty), `withMethods` (add/remove/clear).
9. `<r-cart-badge>` в header → инжектит `CartStore`, читает `totalCount()`.
10. Подключить **Redux DevTools** для Signal Store — убедиться, что оба store видны в браузере с time-travel.
11. `/checkout` lazy route, `canActivate` guard (читает `AuthStore.isAuthorized`).
12. Multi-step Reactive Form: контакты → время самовывоза → «оплата».
13. `canDeactivate` guard от ухода с несохранённой формы.
14. Mongoose схема `Order` + endpoint `POST /api/orders`.
15. Заглушка оплаты: `<r-payment-step>` — прогресс-бар 2 сек, потом success.
16. После заказа: `CartStore.clear()`, редирект на `/account/orders/:id`.

### Demo
- Регистрация → корзина → заказ → попадание в БД.
- В Redux DevTools видна история состояний обоих stores с time-travel.

### Acceptance
- [ ] Refresh-token rotation работает (видно в DevTools cookies).
- [ ] `canDeactivate` спрашивает подтверждение при попытке уйти.
- [ ] Корзина переживает перезагрузку страницы (через `withStorage`).
- [ ] `CartStore` и `AuthStore` отображаются в Redux DevTools.
- [ ] `withStorage` не падает при SSR (нет обращения к `localStorage` на сервере).

---

## Iteration 3 — SSE + Заказы пользователя (≈ 1.5 недели)

**Цель:** Пользователь видит статус заказа в реальном времени. Покрывает C-2, C-3, X-2.

**State management:** заводим первый «фичевой» Signal Store с `withEntities` для коллекций заказов и `rxMethod` для SSE-подписки.

### Шаги
1. В Nest: `EventEmitter2`, событие `order.status.changed`.
2. `OrdersService` эмитит событие при каждом изменении статуса.
3. `@Sse('/api/orders/:id/stream')` endpoint фильтрует по `orderId`.
4. Временно: ручной endpoint `PATCH /api/orders/:id/status` (без UI, через `curl`) для проверки SSE.
5. Frontend: класс `SseClient<T>` (см. ARCHITECTURE.md) — нейтральная обёртка над `EventSource`.
6. `libs/state`: реализовать **`UserOrdersStore`** на `signalStore` с `withEntities<Order>` для коллекции заказов и `rxMethod` для подписки на SSE-стрим конкретного заказа. Метод `subscribeToOrder(id)` стартует SSE и через `patchState + updateEntity` обновляет статус.
7. `OrderDetailComponent`: timeline статусов через `@switch`, читает данные из `UserOrdersStore.entityMap()[id]`, вызывает `subscribeToOrder(id)` в `ngOnInit`/`afterNextRender`.
8. `AccountOrdersComponent`: список заказов через `httpResource` (один раз при заходе) → данные кладутся в `UserOrdersStore` через `setAllEntities`. Пагинация через `linkedSignal` (сброс стр. при смене фильтра).
9. Skeleton-карточки заказов через `@loading (after 100ms; minimum 300ms)`.
10. Индикатор «соединение восстановлено» при reconnect SSE — отдельный `signal` в `UserOrdersStore` (`sseConnected`).

### Demo
- Открыть заказ в одной вкладке, в другой через `curl` поменять статус → видно мгновенно.
- В Redux DevTools видно `updateEntity` действие при каждом SSE-событии.

### Acceptance
- [ ] При обрыве сети `EventSource` сам переподключается, на UI — индикатор.
- [ ] Отписка при уничтожении компонента — `rxMethod` сам убирает подписку при destroy инжектора.
- [ ] `UserOrdersStore` использует `withEntities` (видно в DevTools нормализованную структуру).

---

## Iteration 4 — Админ-зона: заказы (≈ 2 недели)

**Цель:** Админ видит новые заказы моментально, меняет статусы. Покрывает A-1, A-2, A-3.

**State management:** заводим **`AdminOrdersStore`** — самый «фичеёмкий» store в проекте, демонстрирует все возможности Signal Store: `withEntities` для коллекции, `rxMethod` для SSE broadcast, optimistic-update с откатом, `withComputed` для деривированных счётчиков.

### Шаги
1. Создать seed-админа в Nest startup-скрипте.
2. Lazy-route `/admin` с `canMatch(adminGuard)` — chunk не попадает в guest-bundle.
3. Admin layout: sidebar (desktop) / bottom-sheet (mobile).
4. Endpoint `@Sse('/api/admin/orders/stream')` с `RolesGuard`.
5. `libs/state`: реализовать **`AdminOrdersStore`** на `signalStore` с:
   - `withEntities<Order>` для коллекции,
   - `withComputed`: `pendingCount`, `preparingCount`, `readyCount` (бейджи в навигации),
   - `withMethods`: `loadAll()`, `changeStatus(id, status)` с optimistic-update и откатом при ошибке,
   - `rxMethod` `subscribeToBroadcast()` подписывается на SSE; новые заказы добавляются через `addEntity`, обновления — через `updateEntity`,
   - `withHooks.onInit`: автоматически вызвать `loadAll()` + `subscribeToBroadcast()`.
6. `AdminOrdersComponent`: список заказов читает `AdminOrdersStore.entities()`; кнопки статуса → `store.changeStatus(...)`.
7. Кнопки изменения статуса (`@switch (order.status())`).
8. Анимация всплытия нового заказа (Angular animations или CSS).
9. Опциональный звуковой пинг при новом заказе (Audio API, после первого клика юзера — autoplay policy). Реализуется через `effect()` в компоненте, наблюдающий за `entities().length`.
10. Счётчик новых заказов в badge на иконке навигации — из `pendingCount()` computed.

### Demo
- Открыть админку в одной вкладке, гостевую корзину в другой → оформить заказ → админ видит мгновенно.
- В Redux DevTools при изменении статуса видны два события: optimistic-update и потом server-confirmation; при искусственной ошибке — откат.

### Acceptance
- [ ] Guest получает 403 на `/admin` (canMatch блокирует).
- [ ] Admin chunk не попадает в bundle для guest (проверяется через `nx build web --stats-json` + analyzer).
- [ ] Optimistic-update откатывается при искусственной 500-ошибке от Nest.
- [ ] Счётчики `pendingCount`/`preparingCount`/`readyCount` пересчитываются автоматически через `withComputed`.

---

## Iteration 5 — Админ-зона: меню (≈ 1.5 недели)

**Цель:** Админ редактирует меню. Покрывает A-4.

### Шаги
1. `AdminMenuComponent`: таблица блюд с фильтрами/сортировкой.
2. `AdminDishEditComponent` lazy-route с `resolve` для загрузки блюда до показа.
3. Reactive Form: основные поля + кастомный CVA `<r-side-dish-picker>`.
4. Cross-field validator (например, цена > 0, имя обязательно).
5. `canDeactivate` от ухода с dirty-формой.
6. Endpoints `POST/PATCH/DELETE /api/admin/dishes`.
7. После сохранения — публичный `/menu` через `httpResource.reload()` обновляется (если открыт в другой вкладке — увидит при следующей загрузке).
8. Архивирование вместо удаления (`isArchived: true`).

### Demo
- Админ создаёт новое блюдо → переключается в гостевую вкладку → перезагружает `/menu` → видит блюдо.

### Acceptance
- [ ] CVA-контрол валидируется как родная form-control.
- [ ] При попытке уйти с dirty-формой — подтверждение.

---

## Iteration 6 — Аналитика + Дашборд (≈ 1 неделя)

**Цель:** Админ видит график выручки и топ блюд. Покрывает A-5.

### Шаги
1. Mongo aggregation pipelines: выручка по дням, топ блюд.
2. Endpoint `GET /api/admin/analytics/revenue?days=7|30`.
3. Endpoint `GET /api/admin/analytics/top-dishes`.
4. Подключить Chart.js или ng2-charts.
5. `AdminDashboardComponent`: KPI-карточки (`computed` от данных), графики ниже первого экрана через `@defer (on viewport; prefetch on idle)`.
6. Skeleton-плейсхолдеры графиков.
7. Date-range picker (Material).

### Demo
- Дашборд с двумя графиками + 3 KPI-карточками.

### Acceptance
- [ ] Графики не попадают в initial admin chunk (видно в bundle analyzer).
- [ ] При смене date-range — `httpResource` авто-перезапрашивает.

---

## Iteration 7 — SHOULD-фичи (≈ 2 недели)

**Цель:** Дотягиваем до «production-ready» состояния.

### Шаги
1. C-4 «Повторить заказ».
2. C-5 Бронирование столика (`BookingsModule` в Nest + UI).
3. C-6 Отмена заказа.
4. A-6 Список броней у админа.
5. A-7 Список пользователей с CDK Virtual Scroll.
6. G-6 Страница «О ресторане» с JSON-LD.
7. X-3 a11y-полировка: focus-trap в модалках, aria-labels, проверка скринридером.
8. Sitemap + robots.txt.
9. Rate limiting (`@nestjs/throttler`).

### Demo
- Полный flow «забронировал стол + повторил заказ + отменил» работает.

---

## Iteration 8 — Деплой (≈ 1 неделя)

**Цель:** Живой URL.

### Шаги
1. Dockerfile для `web` (SSR) и `api`.
2. `render.yaml` blueprint.
3. MongoDB Atlas M0 cluster, IP allowlist `0.0.0.0/0`, user, connection string.
4. Render: создать оба сервиса, выставить env vars (`MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`).
5. Проверить SSE через прод-URL (Render умеет, но убедиться).
6. GitHub Actions: lint + test + build на PR.
7. README с архитектурной диаграммой, скриншотами, ссылкой на живой деплой.
8. Сидер запускается при первом старте (если БД пустая).

### Demo
- Откидываем ссылку → всё работает.

### Acceptance
- [ ] Cold start < 30 сек (Render free tier засыпает после 15 мин).
- [ ] Lighthouse на проде ≥ 85 / 90 / 90 / 95.

---

## Iteration 9 — NICE-фичи (≈ 1.5 недели)

**Цель:** Полишинг.

### Шаги
1. G-7 i18n (ru/en).
2. G-8 Тёмная тема.
3. X-4 `withViewTransitions()`.
4. C-7 Профиль с аллергенами.
5. C-8 Оценка заказа.
6. A-8 Heatmap по часам.

---

## Iteration 10 — WebSocket finale (≈ 1 неделя)

**Цель:** A-9 — двунаправленный канал админ↔гость.

### Шаги
1. Nest: `@WebSocketGateway` с namespace `/notifications`.
2. Auth handshake: при connect — проверка JWT из cookie.
3. Rooms по `userId`.
4. Событие `admin → user`: «ваш стол готов / заказ ожидает», с acknowledgment.
5. На фронте: native `WebSocket` (без socket.io) обёрнутый в signal-based store.
6. UI: при получении — Material `Snackbar` с кнопкой «принято» → ack.
7. На стороне админа: список отправленных уведомлений со статусом «доставлено / прочитано».

### Demo
- Админ кликает «пинг гостя N» → у гостя моментально toast → клик «ок» → у админа меняется статус на «прочитано».

### Acceptance
- [ ] Канал двунаправленный (видно в Network → WS).
- [ ] При обрыве — auto-reconnect.
- [ ] Сохранён JWT-auth на handshake.

---

## Общая «карта прогресса»

```
Iter 0  ▒░░░░░░░░░░  Bootstrap
Iter 1  ▒▒░░░░░░░░░  Public menu + SSR
Iter 2  ▒▒▒░░░░░░░░  Cart + Auth
Iter 3  ▒▒▒▒░░░░░░░  SSE + user orders
Iter 4  ▒▒▒▒▒░░░░░░  Admin orders board
Iter 5  ▒▒▒▒▒▒░░░░░  Admin menu CRUD
Iter 6  ▒▒▒▒▒▒▒░░░░  Analytics dashboard      ← MVP DONE, можно показывать
Iter 7  ▒▒▒▒▒▒▒▒░░░  SHOULD features
Iter 8  ▒▒▒▒▒▒▒▒▒░░  Deploy                    ← PORTFOLIO-READY
Iter 9  ▒▒▒▒▒▒▒▒▒▒░  NICE features
Iter 10 ▒▒▒▒▒▒▒▒▒▒▒  WebSocket finale
```

**Ориентир по календарю при 10 ч/нед:** ~3.5–4 месяца до полного завершения, ~2.5 месяца до portfolio-ready (после Iter 8). Это без жёсткого дедлайна — реальный темп подкорректируем по факту.

## State management по итерациям (быстрая справка)

| Iter | Что появляется в state-слое |
|---|---|
| 0 | Установлен `@ngrx/signals`, заведены пустые libs `state` и `state-features` |
| 1 | Только локальные сигналы в компонентах + `httpResource` для меню |
| 2 | **Первые stores:** `AuthStore`, `CartStore`. Кастомная feature `withStorage`. Redux DevTools работает |
| 3 | `UserOrdersStore` с `withEntities` + `rxMethod` для SSE |
| 4 | `AdminOrdersStore` — самый «фичеёмкий»: entities + rxMethod + optimistic-update + computed-счётчики |
| 5 | `AdminMenuStore` с `withEntities<Dish>` |
| 6 | Дашборд — `httpResource` без store (read-only данные) |
| 10 | `NotificationsStore` (WS) — bidirectional через WebSocket, с подтверждениями получения |

## Что делать, если в процессе появляются новые идеи

1. Записать идею в `IDEAS.md` (создать, когда возникнет первая).
2. Не вставлять её в текущую итерацию.
3. После завершения текущей итерации — оценить, добавлять ли в следующую (и в какой статус: MUST / SHOULD / NICE).

Это защита от feature creep.
