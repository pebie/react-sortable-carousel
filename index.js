import WebpackDevServer from 'webpack-dev-server';
import CleanPlugin from 'clean-webpack-plugin';
import WebpackConfig from './make-webpack-config';
import webpack from 'webpack';
import path from 'path';
import optimist from 'optimist';
import open from 'open';

let myArgs = optimist.argv;

process.env.NODE_ENV = (myArgs._[1] == "release") ? 'production' : 'development';

let isProd = process.env.NODE_ENV === 'production';
let options = {
  minimize: isProd,
  srcPath: 'src/' + myArgs._[0],
  outputDir: './client',
  separateStylesheet: process.env.NODE_ENV === 'production'
};

if(!isProd){
  Object.assign(options, {
    debug: true,
    devtool: 'eval-cheap-module-source-map',
    hotComponents: true,
  });
}

let myConfig = Object.create(WebpackConfig(options));

if (require.main === module && 'development' === process.env.NODE_ENV) {


  new WebpackDevServer(webpack(myConfig), {
    publicPath: myConfig.output.publicPath,
    hot: true,
    historyApiFallback: true,
    proxy: [
      {
        path: new RegExp('/api/(.*)'),
        target: 'http://localhost:3001/'
      }
    ],
    stats: {
      colors: true
    }
  }).listen(8080, 'localhost', function (err) {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }

    open("http://localhost:8080/webpack-dev-server/");
    console.log('[webpack-dev-server]', 'http://localhost:8080/webpack-dev-server/');
  });
}else{
  options.minimize = true;
  webpack(myConfig, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack-build-production', err);
    }
    console.log('Done see in ', options.outputDir);
  });
}
