'use strict';

const BarFactory = require('./BarFactory');
const RawDossierFactory = require('./RawDossierFactory');

/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {KeySSIFactory} options.keySSIFactory
 * @param {BrickMapStrategyFactory} options.brickMapStrategyFactory
 */
function Factory(options) {
    options = options || {};

    const bootstrapingService = options.bootstrapingService;
    const dlDomain = options.dlDomain;
    const keySSIFactory = options.keySSIFactory;
    const brickMapStrategyFactory = options.brickMapStrategyFactory
    const factories = {};

    if (!bootstrapingService) {
        throw new Error('BootstrapingService is required');
    }

    if (!dlDomain) {
        throw new Error('DLDomain is required');
    }

    if (!keySSIFactory) {
        throw new Error('A KeySSI factory is required');
    }

    if (!brickMapStrategyFactory) {
        throw new Error('A BrickMapStratregy factory is required');
    }

    /**
     * Initialize the factory state
     */
    const initialize = () => {
        const builtinDSURepr = require('../BuiltinDSURepresentations');

        const barFactory = new BarFactory({
            bootstrapingService,
            dlDomain,
            keySSIFactory,
            brickMapStrategyFactory
        });

        const rawDossierFactory = new RawDossierFactory({
            barFactory
        });

        this.registerRepresentation(builtinDSURepr.BAR, barFactory);
        this.registerRepresentation(builtinDSURepr.RAW_DOSSIER, rawDossierFactory);

        const WebDossierFactory = require("./WebDossierFactory");
        const webDossierFactory = new WebDossierFactory({});
        this.registerRepresentation(builtinDSURepr.WEB_DOSSIER, webDossierFactory);

        const NodeDossierFactory = require("./NodeDossierFactory");
        const nodeDossierFactory = new NodeDossierFactory({});
        this.registerRepresentation(builtinDSURepr.NODE_DOSSIER, nodeDossierFactory);

        const WalletFactory = require("./WalletFactory");
        const walletFactory = new WalletFactory({
            rawDossierFactory
        });
        this.registerRepresentation(builtinDSURepr.WALLET, walletFactory);
    }

    ////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////

    /**
     * @param {string} representation
     * @return {boolean}
     */
    this.isValidRepresentation = (representation) => {
        return typeof factories[representation] !== 'undefined';
    };

    /**
     * @param {string} representation
     * @param {object} factory
     */
    this.registerRepresentation = (representation, factory) => {
        factories[representation] = factory;
    }

    /**
     * @param {string} representation
     * @param {object} dsuConfiguration
     * @param {string} dsuConfiguration.favouriteEndpoint
     * @param {string} dsuConfiguration.brickMapStrategyFactory 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} dsuConfiguration.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} dsuConfiguration.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} dsuConfiguration.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BrickMap and then apply the new changes
     * @param {callback} dsuConfiguration.anchoringOptions.anchoringCb A callback which is called when the strategy anchors the changes
     * @param {callback} dsuConfiguration.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} dsuConfiguration.validationRules 
     * @param {object} dsuConfiguration.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BrickMap
     * @param {callback} callback
     */
    this.create = (representation, dsuConfiguration, callback) => {
        const factory = factories[representation];
        factory.create(dsuConfiguration, callback);
    }

    /**
     * @param {string} keySSI
     * @param {string} representation
     * @param {object} dsuConfiguration
     * @param {string} dsuConfiguration.brickMapStrategyFactory 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} dsuConfiguration.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} dsuConfiguration.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} dsuConfiguration.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BrickMap and then apply the new changes
     * @param {callback} dsuConfiguration.anchoringOptions.anchoringCb A callback which is called when the strategy anchors the changes
     * @param {callback} dsuConfiguration.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} dsuConfiguration.validationRules 
     * @param {object} dsuConfiguration.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BrickMap
     * @param {callback} callback
     */
    this.load = (keySSI, representation, dsuConfiguration, callback) => {
        const factory = factories[representation];
        return factory.load(keySSI, dsuConfiguration, callback);
    }

    initialize();
}

module.exports = Factory;
