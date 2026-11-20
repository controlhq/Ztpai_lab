# Room Booking API

REST API do rezerwacji sal (Node.js + Express, PostgreSQL + Knex, JWT z rolami `USER` / `ADMIN`).

## Uruchomienie (Docker Compose)

Wymagania: Git i Docker z Docker Compose.

```bash
git clone https://github.com/controlhq/Ztpai_lab.git
cd Ztpai_lab
cp .env.example .env
docker compose up --build
```

Po starcie (migracje uruchamiają się automatycznie przy starcie kontenera `api`):

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api/docs

Konto `ADMIN` i przykładowe dane tworzy seed, uruchamiany w działającym kontenerze:

```bash
docker compose exec api npx knex seed:run
```

Login administratora: `admin@example.com` / `admin-haslo-123`.

Zatrzymanie: `docker compose down` (dane bazy zostają w wolumenie; `docker compose down -v` usuwa także je).

## Konfiguracja

Wszystkie ustawienia pochodzą z pliku `.env` (wzór: `.env.example`). Przed użyciem poza środowiskiem lokalnym zmień `POSTGRES_PASSWORD` i `JWT_SECRET` (min. 32 znaki).

| Zmienna | Opis |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | dane bazy w kontenerze `db` |
| `DATABASE_URL` | adres bazy przy uruchamianiu poza Dockerem (w kontenerze `api` składany automatycznie z host `db`) |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | podpis i ważność tokenów |

## Uruchomienie lokalne i testy

```bash
npm ci
docker compose up -d db
npm run migrate:latest
npm start
```

```bash
npm run test:unit         # unit testy, bez bazy danych
npm run test:integration  # testy API na osobnej bazie room_booking_test
npm test                  # oba zestawy
```
