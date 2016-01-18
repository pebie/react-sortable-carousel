/**
 * Created by bouchez on 31/07/15.
 */
module.exports = ()=> {
  return {
    get: (options)=> {
      return {
        root: options.srcPath,
        extensions: ['', '.js', '.jsx'],
        modulesDirectories: ['node_modules', options.srcPath]
      };
    }
  };
};
