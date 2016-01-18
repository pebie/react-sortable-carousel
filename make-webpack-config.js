//First line seems to be mandatory :(
//Pebie made this code !
import loadersConfig from './config/loaders';
import pluginsConfig from './config/plugins';
import entryConfig from './config/entry';
import outputConfig from './config/output';
import resolveConfig from './config/resolve';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
//This is a documentation test
//With multiline support

let WebpackConfig = (options)=> {
  let commonLoaders = loadersConfig().getCommons(options);

  let imagesLoaders = loadersConfig().getImages(options);
  let bootstrapLoaders = loadersConfig().getBootstrap(options);
  let plugins = pluginsConfig(options).get(options);
  let entry = entryConfig().get(options);
  let output = outputConfig(options).get(options);
  let resolve = resolveConfig().get(options);
  //One comment line
  let devServer = (process.env.NODE_ENV === 'production') ? null : {
    contentBase: './tmp',
    historyApiFallback: true
  };
  let stylesheetLoaders;
  if(devServer){
    stylesheetLoaders = loadersConfig().getStylesheets(options);
  }else{
    stylesheetLoaders = [{
                          test: /\.scss$/,
                          loader: ExtractTextPlugin.extract('css!sass')
                        }];
  }
  return {
    target: 'web',
    cache: 'true',
    entry: entry,
    resolve: resolve,
    output: output,
    module: {
      loaders: commonLoaders.concat(imagesLoaders).concat(stylesheetLoaders)
    },
    plugins: plugins,
    debug: options.debug,
    devtool: options.devtool,
    devServer: devServer
  };
};

export default WebpackConfig;
