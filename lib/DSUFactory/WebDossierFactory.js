'use strict';

/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {DIDFactory} options.keySSIFactory
 * @param {BarMapStrategyFactory} options.barMapStrategyFactory
 */
function WebDossierFactory(options) {
    options = options || {};
    this.keySSIFactory = options.keySSIFactory;

    ////////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////////
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
     * @param {callback} callback
     */
    this.create = (options, callback) => {
        return callback(new Error("Wrong usage of create function. WebDossier representation is just for loading and interacting purpose."));
    }

    /**
     * @param {string} keySSI
     * @param {object} options
     * @param {callback} callback
     */
    this.load = (keySSI, options, callback) => {

        const envTypes = require("overwrite-require").constants;
        if($$.environmentType !== envTypes.BROWSER_ENVIRONMENT_TYPE){
            return callback(new Error(`WebDossier representation should be used only in browser. Current environment type is <${$$.environmentType}>`));
        }

        options = options || {};
        let keySSIInstance;

        try {
            keySSIInstance = restoreKeySSI(keySSI);
        } catch (e) {
            return callback(e);
        }

        let InteractionBase = require("./InteractionBase");
        const pc = new se.OuterWebWorkerPowerCord("path_to_boot_script", seed);
        InteractionBase.createHandler(keySSI, pc, callback);
    }
}

module.exports = WebDossierFactory;
