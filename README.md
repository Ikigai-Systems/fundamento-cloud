Running
===

```
bin/dev
```
This is equivalent to `foreman start -f Procfile.dev` run manually.

It should spawn two processes:
* rails app listening on port `3000`
* vite devserver listening on port `5173`

Access application via `http://localhost:5173`

Production mode
===

1. `rails db:prepare RAILS_ENV=production` -> once, to setup database schema
2. (re)build frontend: `npm run build` -> this will (re)populate `public` folder
3. `foreman start -f Procfile.prod`  
   This will run rails server on port `3000`

Docker
===
1. To run app, provide secret_base_key as env variable:
```
SECRET_KEY_BASE=abcdef docker-compose up
```
Access application on port `3000`
