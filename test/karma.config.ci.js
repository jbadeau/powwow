var baseConfig = require('./karma.config.js');

module.exports = function(config){
    // Load base config
    baseConfig(config);

    // Override base config
    config.set({
        singleRun: true,
        autoWatch: false
    });
};