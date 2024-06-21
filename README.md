Running
===

```
foreman start
```

This should run three processes:
* rails on port 3000
* vite devserver on port 5173

Access application via `http://localhost:5173`

Production mode
===

1. `rails db:prepare RAILS_ENV=production` -> once, to setup database schema
2. (re)build frontend: `npm run build` -> this will (re)populate `public` folder
3. `foreman start -f Procfile.prod`  
   This will run rails server on port `5000`

Docker
===
1. To build image, run `docker build -t ikigai-systems/prototype1 .`
2. To run it, provide secret_base_key as env variable:
```
2. docker run -p 5000:5000 -ti -e SECRET_KEY_BASE=abcdef ikigai-systems/prototype1
```