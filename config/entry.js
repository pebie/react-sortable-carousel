/**
* Created by bouchez on 31/07/15.
*/
import path from 'path';
import process from 'process';

module.exports = ()=> {
  return {
    get: (options)=> {

      var entries = {
        module: ['./' + options.srcPath + '/index.js']
      };
      var devEntries = {
        common: ['react', 'webpack/hot/only-dev-server'],
        client: ['webpack-dev-server/client?http://localhost:8080']
      };
      if (process.env.NODE_ENV === 'development') {
        entries.module.concat(['webpack/hot/only-dev-server']);
        Object.assign(entries, devEntries);
      }

      return entries;
    }
  };
};
