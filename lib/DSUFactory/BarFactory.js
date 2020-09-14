/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {DIDFactory} options.keySSIFactory
 * @param {BrickMapStrategyFactory} options.brickMapStrategyFactory
 */
function BarFactory(options) {
    const barModule = require('bar');
    const fsAdapter = require('bar-fs-adapter');
    const cache = require('psk-cache').factory();

    const DEFAULT_BRICK_MAP_STRATEGY = "Diff";

    options = options || {};
    this.bootstrapingService = options.bootstrapingService;
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
        const envTypes = require("overwrite-require").constants;
        if($$.environmentType !== envTypes.BROWSER_ENVIRONMENT_TYPE && $$.environmentType !== envTypes.SERVICE_WORKER_ENVIRONMENT_TYPE){
            archiveConfigurator.setFsAdapter("FsAdapter");
        }
        archiveConfigurator.setBufferSize(1000000);
        archiveConfigurator.setKeySSI(keySSI);
        archiveConfigurator.setBootstrapingService(this.bootstrapingService);
        let brickMapStrategyName = options.brickMapStrategy;
        let anchoringOptions = options.anchoringOptions;
        if (!brickMapStrategyName) {
            brickMapStrategyName = DEFAULT_BRICK_MAP_STRATEGY;
        }
        let brickMapStrategy;
        try {
            brickMapStrategy = createBrickMapStrategy(brickMapStrategyName, anchoringOptions);

            archiveConfigurator.setBrickMapStrategy(brickMapStrategy);

            if (options.validationRules) {
                archiveConfigurator.setValidationRules(options.validationRules);
            }
        }catch(e) {
            throw e;
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
     * @return {SecretDID}
     * @param keySSI
     * @param callback
     */
    const initializeKeySSI = (keySSI, callback) => {
        if (typeof keySSI === "function") {
            callback = keySSI;
            keySSI = undefined;
        }

        if (typeof keySSI === "undefined") {
            return callback(Error("A template keySSI should be provided when creating a new DSU."));
        }

        keySSI.initialize(keySSI.getDLDomain(), undefined, undefined, undefined, undefined, callback);
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
    this.create = (keySSI, options, callback) => {
        options = options || {};
        initializeKeySSI(keySSI, (err, _keySSI) => {
            if (err) {
                return callback(err);
            }

            const bar = createInstance(_keySSI, options);
            bar.init(err => callback(err, bar));
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
        const bar = createInstance(keySSI, options);
        bar.load(err => callback(err, bar));
    }
}

module.exports = BarFactory;
