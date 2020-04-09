# local-delivery-network

### Example to get it working with a Vue client

```js
chainWebpack: (webpackConfig) => {
  const publicPath = webpackConfig.output.get('publicPath');

  // render output.json file acceptable for optics_frame
  webpackConfig.plugin('manifest').use(ManifestPlugin, [
    {
      fileName: 'output.json',
      generate: (seed, files) => {
        const paths = [];
        const formatted = files.reduce((manifest, { name, path }) => {
          paths.push(path);
          const format = {
            source: path.replace(publicPath, ''), // remove publicPath, optics_frame generates this instead
            priority: 0
          };
          return { ...manifest, [name]: format };
        }, seed);

        if (process.env.LDN_HOST) {
          const fetch = require('node-fetch');

          const { name } = require('./package.json');
          const devServerPort = process.env.PORT || 8080
          const path = process.env.WEBPACK_DEV_SERVER
            ? `http://localhost:${devServerPort}`
            : webpackConfig.output.get('path');
          const body = JSON.stringify({
            client: {
              name: name,
              path,
              files: paths
            }
          });

          fetch(
            `http://${process.env.LDN_HOST}:${process.env.LDN_PORT}/register`,
            {
              method: 'post',
              body,
              headers: { 'Content-Type': 'application/json' }
            }
          )
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
