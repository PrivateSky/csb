const constants = require("./moduleConstants");
const cache = require('psk-cache').factory();
const BootstrapingService = require("./lib/BootstrapingService");
const DSUFactory = require("./lib/DSUFactory").Factory;
const BrickMapStrategyFactory = require("bar").BrickMapStrategyFactory;

module.exports = {
    getHandler(options){
        options = options || {};
        if (typeof options.bootstrapingService === "undefined") {
            options.bootstrapingService = new BootstrapingService(options);
        }
        const keySSIResolver = require("key-ssi-resolver");
        if (typeof options.dsuFactory === "undefined") {
            options.dsuFactory = new DSUFactory({
                bootstrapingService: options.bootstrapingService,
                dlDomain: options.dlDomain,
                brickMapStrategyFactory: new BrickMapStrategyFactory(),
                keySSIFactory: keySSIResolver.KeySSIFactory,
            })
        }
        return keySSIResolver.initialize(options);
    },
    /*DSURepresentationsNames :{
    Bar,
    SeedDSU,
    SecureDSU,
    ImmutableDSU,
    RedirectDSU,
    CageDSU,
    HandlerDSU
}*/
    resolveSSI(keySSI, dsuRepresentationName, callback){

    },

    createDSU(dsuRepresentationName, callback){

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
    constants: constants
};
