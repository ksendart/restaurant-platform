# Feature Map

Этот документ — **гарантия, что каждая хотелка по Angular-фичам реально покрыта use-case'ом**. Если фича из левого столбца таблицы не имеет use-case в правом — её надо либо выбросить, либо придумать сценарий.

## Прямое сопоставление: Angular feature → продуктовый use-case

| # | Angular feature | Use-case | Где конкретно |
|---|---|---|---|
| 1 | **Standalone components** | везде | весь проект, no NgModules |
| 2 | **Signals (`signal`)** | локальное состояние компонентов | UI-флаги, локальные toggle, временные значения форм |
| 3 | **`computed`** | G-3 фильтрация, A-5 derived KPI | производные показатели дашборда, derived state в Signal Store |
| 4 | **`linkedSignal`** | C-3 пагинация, A-6 сортировка таблиц | сброс страницы при смене фильтра; сброс направления при смене колонки |
| 5 | **`resource` / `httpResource`** | G-3 поиск, C-3 история, A-5 графики | поиск с auto-cancel, зависимые запросы (user → orders) |
| 6 | **`effect`** | звуковое уведомление при `ready` (C-2) | side-effect от изменения статуса |
| 6a | **`@ngrx/signals` `signalStore`** | C-4 корзина (CartStore), G-5 auth (AuthStore), A-2 OrdersStore | глобальные stores с DevTools и конвенциями |
| 6b | **`withState` / `withComputed` / `withMethods` / `withHooks`** | все Signal Stores | структурированное описание store вместо россыпи `@Injectable + signal()` |
| 6c | **`withEntities`** (`@ngrx/signals/entities`) | A-4 меню, A-2 заказы, A-7 пользователи | нормализованное хранение коллекций с `addEntity`/`updateEntity`/`removeEntity` |
| 6d | **`rxMethod`** (`@ngrx/signals/rxjs-interop`) | G-3 поиск с debounce, C-2 SSE подписка | RxJS-операторы (debounce, switchMap) внутри Signal Store |
| 6e | **Custom feature `withStorage`** | G-4 корзина в localStorage | переиспользуемый плагин для persistence через `effect` |
| 6f | **Redux DevTools для Signal Store** | dev experience | inspector состояния, history, replay в браузере |
| 7 | **`@if` / `@else if` / `@else`** | A-1 routing по роли, A-3 кнопки по статусу | условные ветки в шаблонах |
| 8 | **`@switch`** | A-3 рендер карточки заказа по статусу | timeline-шаги |
| 9 | **`@for (track ...)`** | G-2 меню, A-2 доска заказов | все списки |
| 10 | **`@defer (on viewport)`** | G-2 карточки ниже первого экрана, A-5 графики | bundle splitting на UI-уровне |
| 11 | **`@defer (on interaction; prefetch on hover)`** | A-4 модалка редактирования блюда | rich-editor грузится только по клику |
| 12 | **`@defer (hydrate on ...)`** (Incremental Hydration) | G-2 фильтры меню | гидратируются при первом взаимодействии |
| 13 | **`@placeholder` / `@loading (after; minimum)`** | G-2, A-5 | skeleton-карточки блюд, spinner для графика |
| 14 | **SSR (`ng serve:ssr`)** | G-1, G-2, G-6 | публичные страницы, SEO |
| 15 | **`provideClientHydration(withIncrementalHydration(), withEventReplay())`** | G-2 фильтры | hydrate on viewport/interaction |
| 16 | **Zoneless (`provideZonelessChangeDetection`)** | весь app | весь state на сигналах |
| 17 | **Reactive Forms** | C-1, A-4, C-5 | многошаговая форма заказа, форма блюда |
| 18 | **Custom CVA** | A-4 | `<app-side-dish-picker>` с собственной валидацией |
| 19 | **Cross-field validators** | C-1 | «время самовывоза не раньше +30 мин» |
| 20 | **`canMatch` guard** | A-1 | `/admin/*` доступен только role=admin |
| 21 | **`canActivate` guard** | C-1, C-3, A-* | проверка валидности токена |
| 22 | **`canDeactivate` guard** | A-4, C-1 | защита от ухода с несохранённой формой |
| 23 | **`resolve` / data loader** | A-4 (edit dish) | прелоад блюда до показа формы |
| 24 | **Lazy routes (`loadComponent`)** | весь admin раздел | bundle splitting на роутах |
| 25 | **Preloading strategy (custom)** | `/account/*` | preload по `data.preload = true` |
| 26 | **HTTP Interceptor (auth)** | все защищённые запросы | добавление токена, refresh на 401 |
| 27 | **HTTP Interceptor (error)** | X-1 | глобальная обработка ошибок |
| 28 | **`APP_INITIALIZER` / `provideAppInitializer`** | runtime config | загрузка `/config.json` до bootstrap |
| 29 | **`DestroyRef` + `takeUntilDestroyed`** | C-2 SSE | отписка от стрима при уничтожении |
| 30 | **`toSignal` / `toObservable`** | мосты RxJS ↔ signals | где нужны Rx-операторы (debounce в поиске) |
| 31 | **DI с `InjectionToken`** | runtime API URL, feature flags | env-зависимая конфигурация |
| 32 | **DI hierarchy (`@self`, `skipSelf`)** | A-4 form-section | локальный override токена `ControlContainer` |
| 33 | **Material breakpoints (`BreakpointObserver`)** | везде | адаптивная вёрстка |
| 34 | **CDK Virtual Scroll** | A-7 список пользователей | если > 100 строк |
| 35 | **i18n (`@angular/localize`)** | G-7 | ru/en |
| 36 | **`withViewTransitions()`** | X-4 | анимации переходов между роутами |
| 37 | **EventSource / SSE** | C-2, A-2, A-3, X-2 | real-time статусы и доска |
| 38 | **WebSocket (`@WebSocketGateway` в Nest + native WS на клиенте)** | A-9 finale | двунаправленный канал админ↔гость |
| 39 | **Playwright e2e** | smoke-flow гостя | 2-3 теста: меню → корзина → заказ → статус |
| 40 | **TestBed + Deferred Block testing** | A-5 | `fixture.getDeferBlocks()` |

## Обратная проверка: каждая Angular-возможность из «хотелок пользователя»

Хотелки из изначального запроса:

| Хотелка | Покрыто? | Где |
|---|---|---|
| Последняя версия Angular | ✅ | v20+ во всём проекте |
| Сигналы | ✅ | #2, #3, #4, #6, #30 + Signal Store #6a-6f |
| SSR | ✅ | #14, #15 |
| `@if / @else if / @else / @switch` | ✅ | #7, #8 |
| `@defer` | ✅ | #10, #11, #12 |
| Спиннеры и скелетоны | ✅ | #13 (`@loading`, `@placeholder`), Material `mat-progress-spinner` для глобальных загрузок |
| Адаптивная вёрстка | ✅ | #33 + CSS Grid + Material breakpoints |

**Все хотелки закрыты.**

## Не-Angular фичи стека (NestJS / Mongo / monorepo)

| Feature | Use-case | Где |
|---|---|---|
| NestJS Guards (`AuthGuard`, `RolesGuard`) | A-1, A-* | защита admin endpoints |
| NestJS Interceptors | X-1 | трансформация ответов, логирование |
| NestJS Pipes (Zod / class-validator) | C-1, A-4 | валидация DTO |
| NestJS Exception Filters | X-1 | единый формат ошибок |
| `@nestjs/event-emitter` + `Observable` | C-2, A-2 | источник для SSE |
| `Sse()` decorator | C-2, A-2 | реализация SSE на бэке |
| `@WebSocketGateway` | A-9 finale | WS bidirectional |
| Mongoose schemas + discriminators | блюда (plate/sideDish) | один collection с типами |
| Mongoose aggregation pipeline | A-5 | топ-блюд, выручка по дням |
| Refresh-token rotation | auth | httpOnly cookie |
| Nx shared libs (`shared-types`, `shared-dto`) | весь проект | типы между фронтом и бэком |
| Nx generators | dev experience | свой generator для feature folder |
| Docker (multi-stage) | deploy | Dockerfile для каждого app |

## Что осталось «висящим» (требует доработки use-case'а)

На момент написания: **ничего**. Каждая фича из левых столбцов имеет хотя бы один use-case. Если в процессе разработки появится желание показать новую Angular-фичу — обязательно добавляем сюда строку и use-case в `USE-CASES.md`. Без use-case'а фича в проект не попадает (правило «не делаем ради галочки»).
