require("./brickTransportStrategies/brickTransportStrategiesRegistry");
module.exports = {
    attach(brickTransportStrategyName) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(brickTransportStrategyName);
    },

    createHTTPBrickTransportStrategy(initialConfig) {
        const HTTPBrickTransportStrategy = require("./brickTransportStrategies/HTTPBrickTransportStrategy");
        return new HTTPBrickTransportStrategy(initialConfig);
    }
};




