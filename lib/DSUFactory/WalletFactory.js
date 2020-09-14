/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {KeySSIFactory} options.keySSIFactory
 * @param {BrickMapStrategyFactory} options.brickMapStrategyFactory
 */
function WalletFactory(options) {
    options = options || {};
    this.barFactory = options.barFactory;

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
        const defaultOpts = {overwrite: false};
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        Object.assign(defaultOpts, options);
        options = defaultOpts;
        this.barFactory.create(keySSI, options, (err, wallet) => {
            if (err) {
                return callback(err);
            }

            // wallet.mount(pskPath.ensureIsAbsolute(pskPath.join(constants.CSB.CODE_FOLDER, constants.CSB.CONSTITUTION_FOLDER)), options.templateKeySSI, (err => {
            wallet.mount("/code/constitution", options.templateKeySSI, (err => {
                if (err) {
                    return callback(err);
                }

                wallet.getKeySSI((err, _keySSI) => {
                    if (err) {
                        return callback(err);
                    }

                    if (typeof password !== "undefined") {
                        require("../../seedCage").putSeed(_keySSI, options.password, options.overwrite, (err) => {
                            if (err) {
                                return callback(err);
                            }
                            callback(undefined, _keySSI);
                        });
                    } else {
                        callback(undefined, _keySSI);
                    }
                });

            }));
        })

    };

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
        const defaultOpts = {overwrite: false};
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        Object.assign(defaultOpts, options);
        options = defaultOpts;
        if (typeof keySSI === "undefined") {
            require("../../seedCage").getSeed(options.password, (err, seedSSI) => {
                if (err) {
                    return callback(err);
                }
                this.barFactory.load(seedSSI, options, (err, dossier) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(undefined, dossier);
                });
            });
            return;
        }

        this.barFactory.load(keySSI, options, (err, dossier) => {
            if (err) {
                return callback(err);
            }

            if (typeof options.password !== "undefined" && options.password !== null) {
                require("../../seedCage").putSeed(keySSI, options.password, options.overwrite, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(undefined, dossier);
                });
            } else {
                return callback(undefined, dossier);
            }
        });
    };
}

module.exports = WalletFactory;
