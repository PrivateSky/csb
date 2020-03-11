require("./brickTransportStrategies/brickTransportStrategiesRegistry");
const constants = require("./moduleConstants");

function generateUniqueStrategyName(prefix) {
    const randomPart = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
    return prefix + "_" + randomPart;
}

const or = require("overwrite-require");
const browserContexts = [or.constants.SERVICE_WORKER_ENVIRONMENT_TYPE];
if (browserContexts.indexOf($$.environmentType) !== -1) {
    $$.brickTransportStrategiesRegistry.add("http", require("./brickTransportStrategies/FetchBrickTransportStrategy"));
}else{
    $$.brickTransportStrategiesRegistry.add("http", require("./brickTransportStrategies/HTTPBrickTransportStrategy"));
}

module.exports = {
    attachToEndpoint(endpoint) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(endpoint);
    },
    attachWithSeed(compactSeed) {
        const SEED = require("bar").Seed;
        const seed = new SEED(compactSeed);
        return this.attachToEndpoint(seed.getEndpoint());
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
    constants: constants
};