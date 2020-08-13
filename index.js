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
            favouriteEndpoint: options.favouriteEndpoint
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
    resolveSSI(keySSI, dsuRepresentationName, options, callback) {
        let config;
        if (typeof keySSI !== "undefined") {
            const keySSIInstance = KeySSIResolver.KeySSIFactory.create(keySSI);
            try {
                config = $$.BDNS.getConfig(keySSIInstance.getDLDomain());
            } catch (e) {
                config = {favouriteEndpoint: keySSIInstance.getHint(), dlDomain: 'default'};
            }
        }
        const keySSIResolver = initializeResolver(config);
        keySSIResolver.loadDSU(keySSI, dsuRepresentationName, options, callback);
    },

    createDSU(dsuRepresentationName, options, callback) {
        $$.BDNS.getDefaultConfig((err, config) => {
            if (err) {
                return callback(err);
            }

            const keySSIResolver = initializeResolver(config);
            keySSIResolver.createDSU(dsuRepresentationName, options, callback);
        });
    },

    checkForSeedCage(callback) {
        require("./seedCage").check(callback);
    },
    constants: constants
};
