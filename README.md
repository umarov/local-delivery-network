# local-delivery-network

### Example to get it working with a Vue client

```js
  chainWebpack: webpackConfig => {
    const publicPath = webpackConfig.output.get('publicPath')

    // render output.json file acceptable for optics_frame
    webpackConfig.plugin('manifest').use(ManifestPlugin, [
      {
        fileName: 'output.json',
        filter: ({ isInitial }) => isInitial,
        generate: (seed, files) => {
          const paths = []
          const formatted = files.reduce((manifest, { name, path }) => {
            // format for optics_frame
            // `isInitial == true` means we need the chunk to boot the app, order doesnt matter,
            // see https://medium.com/webpack/webpack-4-changes-part-1-week-24-25-fd4d77674e55#dbe8
            paths.push(path)
            const format = {
              source: path.replace(publicPath, ''), // remove publicPath, optics_frame generates this instead
              priority: 0
            }
            return { ...manifest, [name]: format }
          }, seed)

          if (process.env.LDN_HOST) {
            const fetch = require('node-fetch')

            const { name } = require('./package.json')

            const path = process.env.WEBPACK_DEV_SERVER
              ? 'http://localhost:8080'
              : webpackConfig.output.get('path')
            const body = JSON.stringify({
              client: {
                name: name,
                path,
                files: paths
              }
            })

            fetch(`http://${process.env.LDN_HOST}:${process.env.LDN_PORT}/register`, {
              method: 'post',
              body,
              headers: { 'Content-Type': 'application/json' }
            })
              .then(res => res.json())
              .then(json => console.log(JSON.stringify(json, null, 2)))
              .catch(console.error)
          }

          return formatted
        }
      }
    ])
  }

```
