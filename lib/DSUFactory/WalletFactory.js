'use strict';

const constants = require('../../../key-ssi-resolver/lib/constants');

/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {KeySSIFactory} options.keySSIFactory
 * @param {BarMapStrategyFactory} options.barMapStrategyFactory
 */
function WalletFactory(options) {
    options = options || {};
    this.rawDossierFactory = options.rawDossierFactory;

    /**
     * @param {object} options
     * @param {string} options.favouriteEndpoint
     * @param {string} options.barMapStrategy 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} options.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} options.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} options.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BarMap and then apply the new changes
     * @param {callback} options.anchoringOptions.anchoringEventListener An event listener which is called when the strategy anchors the changes
     * @param {callback} options.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} options.validationRules
     * @param {object} options.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BarMap
     * @param {callback} callback
     */
    this.create = (options, callback) => {
        this.rawDossierFactory.create(options, (err, wallet) => {
            if (err) {
                return callback(err);
            }

            wallet.mount(pskPath.ensureIsAbsolute(pskPath.join(constants.CSB.CODE_FOLDER, constants.CSB.CONSTITUTION_FOLDER)), options.templateKeySSI, (err => {
                if (err) {
                    return callback(err);
                }

                const seedSSI = wallet.getSeedSSI();
                if (typeof password !== "undefined") {
                    // require("../seedCage").putSeed(seed, password, overwrite, (err) => {
                    //     if (err) {
                    //         return callback(err);
                    //     }
                        callback(undefined, seedSSI);
                    // });
                } else {
                    callback(undefined, seedSSI);
                }
            }));
        })

    };

    /**
     * @param {string} keySSI
     * @param {object} options
     * @param {string} options.barMapStrategy 'Diff', 'Versioned' or any strategy registered with the factory
     * @param {object} options.anchoringOptions Anchoring options to pass to bar map strategy
     * @param {callback} options.anchoringOptions.decisionFn Callback which will decide when to effectively anchor changes
     *                                                              If empty, the changes will be anchored after each operation
     * @param {callback} options.anchoringOptions.conflictResolutionFn Callback which will handle anchoring conflicts
     *                                                              The default strategy is to reload the BarMap and then apply the new changes
     * @param {callback} options.anchoringOptions.anchoringEventListener An event listener which is called when the strategy anchors the changes
     * @param {callback} options.anchoringOptions.signingFn  A function which will sign the new alias
     * @param {object} options.validationRules
     * @param {object} options.validationRules.preWrite An object capable of validating operations done in the "preWrite" stage of the BarMap
     * @param {callback} callback
     */
    this.load = (keySSI, options, callback) => {
        if (typeof keySSI === "undefined") {
            // require("../seedCage").getSeed(password, (err, seed) => {
            //     if (err) {
            //         return callback(err);
            //     }
            //     this.loadRawDossier(seed, (err, dossier) => {
            //         if (err) {
            //             return callback(err);
            //         }
            //         return callback(undefined, dossier);
            //     });
            // });
            // return;
        }

        this.rawDossierFactory.load(keySSI, (err, dossier) => {
            if (err) {
                return callback(err);
            }

            if (typeof password !== "undefined" && password !== null) {
                // require("../seedCage").putSeed(walletSeed, password, overwrite, (err) => {
                //     if (err) {
                //         return callback(err);
                //     }
                    callback(undefined, dossier);
                // });
            } else {
                return callback(undefined, dossier);
            }
        });
    };
}

module.exports = WalletFactory;
