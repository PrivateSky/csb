require("./brickTransportStrategies/brickTransportStrategiesRegistry");
const constants = require("./moduleConstants");
module.exports = {
    attach(brickTransportStrategyName) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(brickTransportStrategyName);
    },
    attachToEndpoint(endpoint){
        //TODO:test endpoint against regex to determine transport strategy type
        //for now http will be used
        const transportStrategy = new this.HTTPBrickTransportStrategy(endpoint);
        const transportStrategyAlias = "seedBasedStrategy";
        $$.brickTransportStrategiesRegistry.add(transportStrategyAlias, transportStrategy);
        return this.attach(transportStrategyAlias);
    },
    attachFromSeed(compactSeed){
        const SEED = require("bar").Seed;
        const seed = new SEED(compactSeed);
        const transportStrategy = new this.HTTPBrickTransportStrategy(seed.getEndpoint());
        const transportStrategyAlias = "seedBasedStrategy";
        $$.brickTransportStrategiesRegistry.add(transportStrategyAlias, transportStrategy);
        return this.attach(transportStrategyAlias);
    },
    HTTPBrickTransportStrategy: require("./brickTransportStrategies/HTTPBrickTransportStrategy"),
    constants: constants
};


const or = require("overwrite-require");
const browserContexts = [or.constants.SERVICE_WORKER_ENVIRONMENT_TYPE];
if (browserContexts.indexOf($$.environmentType) !== -1) {
    module.exports.FetchBrickTransportationStrategy = require("./brickTransportStrategies/FetchBrickTransportationStrategy");
}



