const constants = require("./moduleConstants");
const cache = require('psk-cache').factory();
const BootstrapingService = require("./lib/BootstrapingService").Service;

module.exports = {
    getHandler(options){
        options = options || {};
        options.seedCage = require("./seedCage");
        if (typeof options.bootstrapingService === "undefined") {
            options.bootstrapingService = new BootstrapingService(options.endpointsConfiguration);
        }
        const keySSIResolver = require("key-ssi-resolver");
        return keySSIResolver.initialize(options);
    },
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
    attachWithPassword(password, callback) {
        require("./seedCage").getSeed(password, (err, seed) => {
            if (err) {
                return callback(err);
            }

            this.attachWithSeed(seed, callback);
        });
    },
    checkForSeedCage(callback) {
        require("./seedCage").check(callback);
    },
    RawDossier: require('../dossier/lib/RawDossier'),
    constants: constants
};
