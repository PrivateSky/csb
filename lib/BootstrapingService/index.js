'use strict';

const RequestsChain = require('./RequestsChain');
const BRICK_STORAGE = 'brickStorage';
const ANCHOR_SERVICE = 'anchorService';

/**
 *
 * @param options.endpoints - array of objects that contain an endpoint and the endpoint's type
 * @constructor
 */

function BootstrapingService(options) {
    const openDSU = require("opendsu");
    const services = {
        'brickStorage': openDSU.loadApi("bricking"),
        'anchorService': openDSU.loadApi("anchoring")
    }
    const bdns = openDSU.loadApi("bdns");

    ////////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////////


    /**
     * @param {string} method
     * @param {Array<object>} endpointsPool
     * @param {string} favEndpoint
     * @param {...} args
     * @return {RequestChain}
     */
    const createRequestsChain = (method, serviceName, ...args) => {
        const requestsChain = new RequestsChain();
        const service = services[serviceName];

        requestsChain.add(service, method, args);

        return requestsChain;
    };

    ////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////
    this.getBrick = (hashLinkSSI, callback) => {
        const requestsChain = createRequestsChain('getBrick', BRICK_STORAGE, hashLinkSSI);
        requestsChain.execute(callback);
    }

    this.getMultipleBricks = (hashLinkSSIs, callback) => {
        const requestsChain = createRequestsChain('getMultipleBricks', BRICK_STORAGE, hashLinkSSIs);
        requestsChain.execute(callback);
    }

    this.putBrick = (keySSI, brick, callback) => {
        const requestsChain = createRequestsChain('putBrick', BRICK_STORAGE, keySSI, brick);
        requestsChain.execute(callback);
    }

    this.versions = (keySSI, callback) => {
        const requestsChain = createRequestsChain('versions', ANCHOR_SERVICE, keySSI);
        requestsChain.execute(callback);

    }

    this.addVersion = (keySSI, hashLinkSSI, lastHashLinkSSI, callback) => {
        const requestsChain = createRequestsChain('addVersion', ANCHOR_SERVICE, keySSI, hashLinkSSI, lastHashLinkSSI);
        requestsChain.execute(callback);
    }
}

module.exports = BootstrapingService;
