# local-delivery-network

Small server to run locally as a CDN.

The use-case is for back-ends that serve multiple different Single Page Apps on different URLs and provide built-in auth.

With this server, you can have a single url to serve from and it will serve all the files that are inside the `BASE_DIR`. It's very performant and can handle 1000+ requests per second.

## Getting started

```bash
npm run start
```

### API

#### GET `/`: Returns all the clients stored

```json
// http://localhost:3000
{
  "baseDir": "/home/YOUR_USER/code/projects",
  "aggregatedMode": false,
  "apps": {
    "app2": [
      {
        "css": ["app.fb0c6e1c.css"]
      },
      "index.html",
      {
        "js": [
          "app.cedb4a92.js.map",
          "chunk-vendors.b06ef9f7.js",
          "chunk-vendors.b06ef9f7.js.map",
          "app.cedb4a92.js"
        ]
      },
      "favicon.ico",
      {
        "img": ["logo.82b9c7a5.png"]
      }
    ],
    "app1": [
      {
        "css": ["app.fb0c6e1c.css"]
      },
      "index.html",
      {
        "js": [
          "chunk-vendors.b06ef9f7.js",
          "app.73959a66.js.map",
          "chunk-vendors.b06ef9f7.js.map",
          "app.73959a66.js"
        ]
      },
      "favicon.ico",
      {
        "img": ["logo.82b9c7a5.png"]
      }
    ]
  }
}
```

#### GET `/:client`: Shows all the client files and assets

```json
// http://localhost:3000/app1
{
  "app1": [
    {
      "css": ["app.fb0c6e1c.css"]
    },
    "index.html",
    {
      "js": [
        "chunk-vendors.b06ef9f7.js",
        "app.73959a66.js.map",
        "chunk-vendors.b06ef9f7.js.map",
        "app.73959a66.js"
      ]
    },
    "favicon.ico",
    {
      "img": ["logo.82b9c7a5.png"]
    }
  ]
}
```

#### GET `/:client/*`: Serves the files in the client manifest with the correct mime-type

```html
<!-- http://localhost:3000/app1/index.html -->
<!DOCTYPE html><html lang=en><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content="IE=edge"><meta name=viewport content="width=device-width,initial-scale=1"><link rel=icon href=/favicon.ico><title>app1</title><link href=/css/app.fb0c6e1c.css rel=preload as=style><link href=/js/app.73959a66.js rel=preload as=script><link href=/js/chunk-vendors.b06ef9f7.js rel=preload as=script><link href=/css/app.fb0c6e1c.css rel=stylesheet></head><body><noscript><strong>We're sorry but app1 doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id=app></div><script src=/js/chunk-vendors.b06ef9f7.js></script><script src=/js/app.73959a66.js></script></body></html>
```


## Performance

### Load all apps rescursively

```bash
 autocannon -d 30 -p 8 localhost:3000
Running 30s test @ http://localhost:3000
10 connections with 8 pipelining factor

┌─────────┬──────┬──────┬───────┬───────┬────────┬──────────┬──────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg    │ Stdev    │ Max      │
├─────────┼──────┼──────┼───────┼───────┼────────┼──────────┼──────────┤
│ Latency │ 0 ms │ 0 ms │ 36 ms │ 38 ms │ 5.1 ms │ 10.95 ms │ 54.69 ms │
└─────────┴──────┴──────┴───────┴───────┴────────┴──────────┴──────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 1709    │ 1709    │ 1890    │ 2004    │ 1875.24 │ 64.46   │ 1709    │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Bytes/Sec │ 1.13 MB │ 1.13 MB │ 1.25 MB │ 1.32 MB │ 1.24 MB │ 42.5 kB │ 1.13 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘

Req/Bytes counts sampled once per second.

56k requests in 30.06s, 37.1 MB read
```

### Load one app recursively

```bash
 autocannon -d 30 -p 10 localhost:3000/app1
Running 30s test @ http://localhost:3000/app1
10 connections with 10 pipelining factor

┌─────────┬──────┬──────┬───────┬───────┬─────────┬─────────┬───────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg     │ Stdev   │ Max       │
├─────────┼──────┼──────┼───────┼───────┼─────────┼─────────┼───────────┤
│ Latency │ 0 ms │ 0 ms │ 24 ms │ 26 ms │ 2.69 ms │ 6.81 ms │ 149.11 ms │
└─────────┴──────┴──────┴───────┴───────┴─────────┴─────────┴───────────┘
┌───────────┬────────┬────────┬─────────┬─────────┬─────────┬────────┬────────┐
│ Stat      │ 1%     │ 2.5%   │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min    │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Req/Sec   │ 2042   │ 2042   │ 3575    │ 3841    │ 3531.24 │ 314.73 │ 2042   │
├───────────┼────────┼────────┼─────────┼─────────┼─────────┼────────┼────────┤
│ Bytes/Sec │ 768 kB │ 768 kB │ 1.34 MB │ 1.44 MB │ 1.33 MB │ 118 kB │ 768 kB │
└───────────┴────────┴────────┴─────────┴─────────┴─────────┴────────┴────────┘

Req/Bytes counts sampled once per second.

106k requests in 30.05s, 39.8 MB read
```

### Load a file from an app

```bash
 autocannon -d 30 -p 10 localhost:3000/app1/index.html
Running 30s test @ http://localhost:3000/app1/index.html
10 connections with 10 pipelining factor

┌─────────┬──────┬──────┬───────┬───────┬─────────┬─────────┬──────────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg     │ Stdev   │ Max      │
├─────────┼──────┼──────┼───────┼───────┼─────────┼─────────┼──────────┤
│ Latency │ 0 ms │ 0 ms │ 42 ms │ 44 ms │ 2.03 ms │ 8.41 ms │ 74.66 ms │
└─────────┴──────┴──────┴───────┴───────┴─────────┴─────────┴──────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Req/Sec   │ 2807    │ 2807    │ 4727    │ 5279    │ 4642.07 │ 465.51 │ 2807    │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┤
│ Bytes/Sec │ 2.48 MB │ 2.48 MB │ 4.18 MB │ 4.67 MB │ 4.1 MB  │ 411 kB │ 2.48 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.

139k requests in 30.05s, 123 MB read
```
