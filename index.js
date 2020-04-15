require("./brickTransportStrategies/brickTransportStrategiesRegistry");
const constants = require("./moduleConstants");

const or = require("overwrite-require");
const browserContexts = [or.constants.SERVICE_WORKER_ENVIRONMENT_TYPE];
let cache;

if (browserContexts.indexOf($$.environmentType) !== -1) {
    $$.brickTransportStrategiesRegistry.add("http", require("./brickTransportStrategies/FetchBrickTransportStrategy"));
    cache = require('psk-cache').factory();
} else {
    $$.brickTransportStrategiesRegistry.add("http", require("./brickTransportStrategies/HTTPBrickTransportStrategy"));
}

module.exports = {
    attachToEndpoint(endpoint) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(endpoint, {
            cache
        });
    },
    attachWithSeed(compactSeed, callback) {
        const SEED = require("bar").Seed;
        let seed;
        try {
            seed = new SEED(compactSeed);
        } catch (err) {
            return callback(err);
        }

        callback(undefined, this.attachToEndpoint(seed.getEndpoint()));
    },
    attachWithPin(pin, callback) {
        require("./seedCage").getSeed(pin, (err, seed) => {
            if (err) {
                return callback(err);
            }

            this.attachWithSeed(seed, callback);
        });
    },
    checkForSeedCage(callback) {
        require("./seedCage").check(callback);
    },
    constants: constants
};
