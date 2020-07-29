const constants = require("./moduleConstants");
const cache = require('psk-cache').factory();
require("./lib/BDNS");
const BootstrapingService = require("./lib/BootstrapingService");
const DSUFactory = require("./lib/DSUFactory").Factory;
const BrickMapStrategyFactory = require("bar").BrickMapStrategyFactory;
const KeySSIResolver = require("key-ssi-resolver");

function initializeResolver(options) {
    options = options || {};
    if (typeof options.bootstrapingService === "undefined") {
        options.bootstrapingService = new BootstrapingService(options);
    }
    if (typeof options.dsuFactory === "undefined") {
        options.dsuFactory = new DSUFactory({
            bootstrapingService: options.bootstrapingService,
            dlDomain: options.dlDomain,
            brickMapStrategyFactory: new BrickMapStrategyFactory(),
            keySSIFactory: KeySSIResolver.KeySSIFactory,
        })
    }
    return KeySSIResolver.initialize(options);
}

module.exports = {
    /*DSURepresentationsNames :{
    Bar,
    SeedDSU,
    SecureDSU,
    ImmutableDSU,
    RedirectDSU,
    CageDSU,
    HandlerDSU
}*/
    resolveSSI(keySSI, dsuRepresentationName, options, callback){
        const keySSIInstance = KeySSIResolver.KeySSIFactory.create(keySSI);
        const keySSIResolver = initializeResolver($$.BDNS.getConfig(keySSIInstance.getDLDomain()));
        keySSIResolver.loadDSU(keySSI, dsuRepresentationName, options, callback);
    },

    createDSU(dsuRepresentationName, options, callback){
        const keySSIResolver = initializeResolver($$.BDNS.getDefaultConfig());
        keySSIResolver.createDSU(dsuRepresentationName, options, callback);
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
