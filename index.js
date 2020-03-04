require("./brickTransportStrategies/brickTransportStrategiesRegistry");
const constants = require("./moduleConstants");

function generateUniqueStrategyName(prefix) {
    const randomPart = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    return prefix + "_" + randomPart;
}
module.exports = {
    attach(brickTransportStrategyName) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(brickTransportStrategyName);
    },
    attachToEndpoint(endpoint) {
        //TODO:test endpoint against regex to determine transport strategy type
        //for now http will be used
        const transportStrategy = new this.HTTPBrickTransportStrategy(endpoint);
        const transportStrategyAlias = generateUniqueStrategyName("endpointBasedStrategy");
        $$.brickTransportStrategiesRegistry.add(transportStrategyAlias, transportStrategy);
        return this.attach(transportStrategyAlias);
    },
    attachWithSeed(compactSeed) {
        const SEED = require("bar").Seed;
        const seed = new SEED(compactSeed);
        const transportStrategy = new this.HTTPBrickTransportStrategy(seed.getEndpoint());
        const transportStrategyAlias = generateUniqueStrategyName("seedBasedStrategy");
        $$.brickTransportStrategiesRegistry.add(transportStrategyAlias, transportStrategy);
        return this.attach(transportStrategyAlias);
    },
    attachWithPin(pin, callback) {
        require("./seedCage").getSeed(pin, (err, seed) => {
            if (err) {
                return callback(err);
            }

            let edfs;
            try {
                edfs = this.attachWithSeed(seed);
            } catch (e) {
                return callback(e);
            }

            callback(undefined, edfs);
        });
    },
    checkForSeedCage(callback) {
        require("./seedCage").check(callback);
    },
    HTTPBrickTransportStrategy: require("./brickTransportStrategies/HTTPBrickTransportStrategy"),
    constants: constants
};


const or = require("overwrite-require");
const browserContexts = [or.constants.SERVICE_WORKER_ENVIRONMENT_TYPE];
if (browserContexts.indexOf($$.environmentType) !== -1) {
    module.exports.FetchBrickTransportStrategy = require("./brickTransportStrategies/FetchBrickTransportStrategy");
}



