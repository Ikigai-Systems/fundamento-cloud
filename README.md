# Running

```
bin/dev
```
This is equivalent to `foreman start -f Procfile.dev` run manually.

It should spawn two processes:
* rails app listening on port `3000`
* vite devserver listening on port `3036`

Access application via `http://localhost:3000`

# Production mode

1. `rails db:prepare RAILS_ENV=production` -> once, to setup database schema
2. (re)build frontend: `npm run build` -> this will (re)populate `public` folder
3. `foreman start -f Procfile.prod`  
   This will run rails server on port `3000`

# Docker

1. To run app, provide secret_base_key as env variable:
```
SECRET_KEY_BASE=abcdef docker-compose up
```
Access application on port `3000`

## Running only selected services

```
docker compose up redis postgresql
```

Running the same docker compose again with different name: 
```
docker compose -p e2e-tests up
```

# Running tests

## E2E

Tests run against an app running locally with `RAILS_ENV=test`, they are built with docker and have the same environment as production. 

Prepare docker containers:

`RAILS_ENV=test docker compose -p e2e-tests up`

`-p e2e-tests` will name containers starting with `e2e-tests` so there's no collision with regular `docker-compose.yml`, but they still use the same ports so it's not possible to run the app from docker or locally at the same time (to be fixed in the future)

Run tests:

- headless: `npx cypress run --project spec/e2e`
- with a desktop app: `npx cypress open --project spec/e2e`

Clean containers and images afterwards:

`docker compose -p e2e-tests down --remove-orphans --rmi local`