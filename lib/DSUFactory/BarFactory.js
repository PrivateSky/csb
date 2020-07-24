const barModule = require('bar');
const fsAdapter = require('bar-fs-adapter');
const cache = require('psk-cache').factory();

const DEFAULT_BAR_MAP_STRATEGY = "Diff";

/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {DIDFactory} options.keySSIFactory
 * @param {BrickMapStrategyFactory} options.brickMapStrategyFactory
 */
function BarFactory(options) {
    options = options || {};
    this.bootstrapingService = options.bootstrapingService;
    this.dlDomain = options.dlDomain;
    this.keySSIFactory = options.keySSIFactory;
    this.brickMapStrategyFactory = options.brickMapStrategyFactory;

    ////////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////////

    /**
     * @param {BaseDID} keySSI
     * @param {object} options
     * @return {Archive}
     */
    const createInstance = (keySSI, options) => {
        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", fsAdapter.createFsAdapter);
        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setCache(cache);
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setBufferSize(1000000);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setKeySSI(keySSI);
        archiveConfigurator.setBootstrapingService(this.bootstrapingService);

        let brickMapStrategyName = options.brickMapStrategy;
        let anchoringOptions = options.anchoringOptions;
        if (!brickMapStrategyName) {
            brickMapStrategyName = DEFAULT_BAR_MAP_STRATEGY;
        }
        const brickMapStrategy = createBrickMapStrategy(brickMapStrategyName, anchoringOptions);

        archiveConfigurator.setBrickMapStrategy(brickMapStrategy);

        if (options.validationRules) {
            archiveConfigurator.setValidationRules(options.validationRules);
        }

        const bar = barModule.createArchive(archiveConfigurator);
        return bar;
    }

    /**
     * @return {object}
     */
    const createBrickMapStrategy = (name, options) => {
        const strategy = this.brickMapStrategyFactory.create(name, options);
        return strategy;
    }

    /**
     * @param {object} options
     * @return {SecretDID}
     */
    const createKeySSI = (callback) => {
        const seedSSI = this.keySSIFactory.create("seed");
        seedSSI.initialize(this.dlDomain, undefined, undefined, undefined, options.favouriteEndpoint, callback);
    }

    /**
     * @param {string} keySSI
     * @return {BaseDID}
     */
    const restoreKeySSI = (keySSI) => {
        return this.keySSIFactory.create(keySSI);
    }

    ////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////

    /**
     * @param {object} options
     * @param {string} options.favouriteEndpoint
     * @param {string} options.brickMapStrategy 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} options.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} options.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} options.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BrickMap and then apply the new changes
     * @param {callback} options.anchoringOptions.anchoringEventListener An event listener which is called when the strategy anchors the changes
     * @param {callback} options.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} options.validationRules 
     * @param {object} options.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BrickMap
     * @param {callback} callback
     */
    this.create = (options, callback) => {
        options = options || {};
        let keySSI;

        createKeySSI((err, keySSI) => {
            if (err) {
                return callback(err);
            }
            const bar = createInstance(keySSI, options);
            bar.init((err) => {
                if (err) {
                    return callback(err);
                }

                return callback(undefined, bar);
            });
        });
    }

    /**
     * @param {string} keySSI
     * @param {object} options
     * @param {string} options.brickMapStrategy 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} options.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} options.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} options.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BrickMap and then apply the new changes
     * @param {callback} options.anchoringOptions.anchoringEventListener An event listener which is called when the strategy anchors the changes
     * @param {callback} options.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} options.validationRules 
     * @param {object} options.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BrickMap
     * @param {callback} callback
     */
    this.load = (keySSI, options, callback) => {
        options = options || {};
        let keySSIInstance;

        try {
            keySSIInstance = restoreKeySSI(keySSI);
        } catch (e) {
            return callback(e);
        }

        const bar = createInstance(keySSIInstance, options);
        bar.load((err) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, bar);
        })
    }
}

module.exports = BarFactory;
