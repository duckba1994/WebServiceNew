# Deploy React frontend to IIS

This repository builds a static React single-page app. IIS serves the **contents of `build/`**; it does not run `npm start` in production. These steps assume the frontend occupies the root of its own IIS site. The currently supplied API origin is `http://10.52.100.14:803`; the suggested frontend binding, if it is on that same server, is `http://10.52.100.14:804/`.

## Before building

1. The browser-reachable API origin is set in `.env.production`. It currently points to `http://10.52.100.14:803`. The frontend appends `/api/v1` itself, so do not include `/swagger` or `/api/v1` in this value.
2. On each frontend update, build from this repository:

   ```powershell
   npm run build
   ```

   Run `npm ci` first on a fresh checkout or when dependencies change. The API URL is embedded at build time. If the API origin changes, edit `.env.production` and rebuild.

## IIS setup

1. Install the IIS **Static Content** feature and the Microsoft **URL Rewrite** module on the server.
2. Create an IIS site whose physical path is the deployment folder. For a static-only application pool, use **No Managed Code**. For the proposed internal setup, bind HTTP to port `804` and the server IP `10.52.100.14`. Open that port in the server firewall if clients connect from other machines. For an HTTPS site, first give the API HTTPS as well: an HTTPS frontend cannot call this HTTP API from the browser because of mixed-content blocking.
3. After every build, copy everything *inside* `F:\Wichit\work\WebReact\WebService\build` into that physical path, including `index.html`, `static/`, and `web.config`. Do not use a ZIP in `tmp/`; it was only a one-time transfer copy. Give the IIS application-pool identity read access to the folder.
4. Configure the backend CORS policy to allow the exact frontend origin (for the proposal, `http://10.52.100.14:804`) and required request headers/methods. Different ports count as different origins. Allow `Authorization` and `Content-Type`, and the methods the API actually uses. Apply this on the API server; an IIS rule in the frontend site does not grant CORS access.

`public/web.config` is copied into `build/` by Create React App. It serves `index.html` for client-side routes, while leaving actual files and the `/api` path alone.

## Verify

- Open the site root and sign in.
- Directly open and refresh `/dashboard` and `/inbox`; both should return the React app rather than IIS 404.
- In browser DevTools, check that `/static/...` files return their real JavaScript/CSS and API requests go to the configured backend URL. A failed API request with the frontend working usually points to the API URL, TLS certificate, CORS policy, or backend availability.

## Hosting below a path

For a URL such as `https://server/businessapp/`, set `PUBLIC_URL=/businessapp` during the build and set `<BrowserRouter basename="/businessapp">` in `src/App.tsx`. Internal absolute paths and any backend URL must be checked for that mount point. Use the root-site setup above until the intended path is confirmed.
