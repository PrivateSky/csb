'use strict';

/**
 * @param {object} options
 * @param {BootstrapingService} options.bootstrapingService
 * @param {string} options.dlDomain
 * @param {DIDFactory} options.keySSIFactory
 * @param {BrickMapStrategyFactory} options.brickMapStrategyFactory
 */
function NodeDossierFactory(options) {
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
        return callback(new Error("Wrong usage of create function. NodeDossier representation is just for loading and interacting purpose."));
    }

    /**
     * @param {string} keySSI
     * @param {object} options
     * @param {callback} callback
     */
    this.load = (keySSI, options, callback) => {

        const envTypes = require("overwrite-require").constants;
        if($$.environmentType !== envTypes.NODEJS_ENVIRONMENT_TYPE){
            return callback(new Error(`NodeDossier representation should be used only in NodeJS. Current environment type is <${$$.environmentType}>`));
        }

        options = options || {};
        let keySSIInstance;

        try {
            keySSIInstance = restoreKeySSI(keySSI);
        } catch (e) {
            return callback(e);
        }

        const pathName = "path";
        const path = require(pathName);
        const se = require("swarm-engine");
        if(typeof $$ === "undefined" || typeof $$.swarmEngine === "undefined"){
            se.initialise();
        }
        const powerCord = new se.OuterThreadPowerCord(path.join(process.env.PSK_ROOT_INSTALATION_FOLDER, "psknode/bundles/threadBoot.js"), false, keySSI);
        let InteractionBase = require("./InteractionBase");
        InteractionBase.createHandler(keySSI, powerCord, callback);
    }
}

module.exports = NodeDossierFactory;
