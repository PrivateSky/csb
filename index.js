require("./brickTransportStrategies/brickTransportStrategiesRegistry");
const constants = require("./moduleConstants");
module.exports = {
    attach(brickTransportStrategyName) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(brickTransportStrategyName);
    },

    HTTPBrickTransportStrategy: require("./brickTransportStrategies/HTTPBrickTransportStrategy"),
    constants: constants
};



