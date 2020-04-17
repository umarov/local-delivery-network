# local-delivery-network

Small server to run locally as a CDN. You register all the files you want to server from your local file system or dev server.

The use-case is for back-ends that serve multiple different Single Page Apps on different URLs and provide built-in auth.

With this server, you can have a single url to serve from and it will serve all the files that are registered to it. It's very performant and can handle 1000+ requests per second.

## Getting started

```bash
npm run start
```

### API

#### GET `/`: Returns all the clients stored

```json
{
  "projects": [
    {
      "code-shop-timer": {
        "path": "/home/mumarov/personal_code/code-shop-timer/dist",
        "files": [
          {
            "path": "http://localhost:3000/code-shop-timer/js/app.js",
            "name": "js/app.js"
          },
          {
            "path": "http://localhost:3000/code-shop-timer/index.html",
            "name": "index.html"
          }
        ]
      }
    },
    {
      "code-shop-timer-v2": {
        "path": "/home/mumarov/personal_code/code-shop-timer-v2/dist",
        "files": [
          {
            "path": "http://localhost:3000/code-shop-timer-v2/js/app.js",
            "name": "js/app.js"
          },
          {
            "path": "http://localhost:3000/code-shop-timer-v2/index.html",
            "name": "index.html"
          }
        ]
      }
    }
  ]
}
```

#### POST `/register`: Endpoint to register your client and all of its assets

```js
{
  client: {
    name: 'code-shop-timer,
    path: '/home/mumarov/personal_code/code-shop-timer/dist',
    files: [
      {
        path: "http://localhost:3000/code-shop-timer/js/app.js",
        name: "js/app.js"
      },
      {
        path: "http://localhost:3000/code-shop-timer/index.html",
        name: "index.html"
      }
    ]
  }
}
```

#### GET `/:client/*`: Serves the files in the client manifest with the correct mime-type

It will return a 404 if the requested file doesn't exist on the manifest.

### Example to get it working with a Vue client

```js
chainWebpack: (webpackConfig) => {
  const publicPath = webpackConfig.output.get('publicPath');

  webpackConfig.plugin('manifest').use(ManifestPlugin, [
    {
      fileName: 'output.json',
      generate: (seed, files) => {
        const paths = [];
        const formatted = files.reduce(
          (manifest, { name, path, isInitial }) => {
            // `isInitial == true` means we need the chunk to boot the app, order doesnt matter,
            // see https://medium.com/webpack/webpack-4-changes-part-1-week-24-25-fd4d77674e55#dbe8
            paths.push({ path, name });

            if (isInitial) {
              const format = {
                source: path.replace(publicPath, ''),
                priority: 0
              };
              return { ...manifest, [name]: format };
            } else {
              return manifest;
            }
          },
          seed
        );

        paths.push({ path: `${publicPath}output.json`, name: 'output.json' });

        if (process.env.LDN_HOST) {
          const fetch = require('node-fetch');

          const { name } = require('./package.json');

          const path = process.env.WEBPACK_DEV_SERVER
            ? 'http://localhost:8080'
            : webpackConfig.output.get('path');
          const body = JSON.stringify({
            client: {
              name: name,
              path,
              files: paths
            }
          });

          fetch(`${process.env.LDN_HOST}/register`, {
            method: 'post',
            body,
            headers: { 'Content-Type': 'application/json' }
          })
            .then((res) => res.json())
            .then((json) => console.log(JSON.stringify(json, null, 2)))
            .catch(console.error);
        }

        return formatted;
      }
    }
  ]);
};
```
