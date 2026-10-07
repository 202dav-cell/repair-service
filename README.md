# DAV Service

Система управления ремонтом сервисного центра.

## Production

Публичная страница использует:

- `index.html` — HTML приложения;
- `dist/css/app.min.css` — единый production CSS;
- `dist/js/app.min.js` — единый production JavaScript bundle;
- `src/` — исходные модули, которые не подключаются отдельными `<script>` тегами;
- `scripts/build.mjs` — production-сборка через esbuild.

После изменения исходников:

```bash
npm install
npm run build
```

GitHub Actions автоматически пересобирает `dist/` при push в `main`.

## Supabase

Клиент использует только Publishable Key. Secret/service-role key в браузерный код не помещается.

Администрирование сотрудников выполняется через Edge Functions:

- `create-employee`
- `update-employee-role`

RLS для `profiles` описан в:

`supabase/migrations/20261007_employee_security.sql`

Перед использованием функции создания сотрудников необходимо применить эту миграцию к Supabase и развернуть Edge Functions.

### Развертывание функций

После установки Supabase CLI:

```bash
supabase login
supabase link --project-ref xuhpdymilkoksowgefhr
supabase functions deploy
```

Для автоматического деплоя через GitHub Actions добавьте в Secrets репозитория:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID` = `xuhpdymilkoksowgefhr`

Workflow: `.github/workflows/supabase-functions.yml`.

## Безопасность

Не добавляйте `SUPABASE_SERVICE_ROLE_KEY` в `src/`, `dist/` или другие файлы GitHub. Service-role ключ используется только внутри Edge Functions через переменную окружения Supabase.
