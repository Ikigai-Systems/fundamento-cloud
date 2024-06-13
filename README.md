Running
===

```
foreman start
```

This should run three processes:
* rails on port 3000
* y-websocket-server on port 1234 (for document collaboration)
* vite devserver on port 5173

Access application via `http://localhost:5173`

Production mode
===

1. (re)build first frontend: `npm run build` -> this will populate `public` folder
2. `RAILS_SERVE_STATIC_FILES=true RAILS_ENV=production rails s`  
   _at the moment I'm writing ^this doesn't work due to missing SSL certificates and etc_
3. Rails server will listen on port `<fill in later>`
