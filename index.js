require("./brickTransportStrategies/brickTransportStrategiesRegistry");
require("./constants");
module.exports = {
    attach(brickTransportStrategyName) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(brickTransportStrategyName);
    },

    HTTPBrickTransportStrategy: require("./brickTransportStrategies/HTTPBrickTransportStrategy")
};



