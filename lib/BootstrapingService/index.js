'use strict';

const Service = require('./Service');
const RequestsChain = require('./RequestsChain');
const BRICK_STORAGE = 'brickStorage';
const ANCHOR_SERVICE = 'anchorService';

/**
 *
 * @param options.endpoints - array of objects that contain an endpoint and the endpoint's type
 * @constructor
 */

function BootstrapingService(options) {
    options = options || {};

    const brickEndpoints = [];
    const aliasEndpoints = [];

    ////////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////////
    const initialize = () => {
        if(Array.isArray(options.endpoints)) {
            options.endpoints.forEach(endpointObj => {
                if (endpointObj.type === BRICK_STORAGE) {
                    this.addBrickStorageEndpoint(endpointObj.endpoint, endpointObj.type);
                } else if (endpointObj.type === ANCHOR_SERVICE) {
                    this.addAliasingEndpoint(endpointObj.endpoint, endpointObj.type);
                }
            });
        }
    };

    /**
     * @param {Array<object>} pool
     * @param {string} endpoint
     * @param {string} name
     */
    const createService = (pool, endpoint, name) => {
        if (!Service.isValid(name)) {
            throw new Error(`Invalid service: ${name}`);
        }

        const foundIndex = pool.findIndex(el => el.endpoint === endpoint && el.serviceName === name);
        if (foundIndex !== -1) {
            return;
        }

        const service = Service.factory(name, {
            endpoint: endpoint
        });

        pool.push({
            endpoint,
            service,
            serviceName: name
        });
    }

    /**
     * @param {Array<object>} pool
     * @param {string} favEndpoint
     */
    const getEndpointsSortedByFav = (pool, favEndpoint) => {
        pool.sort((a, b) => {
            if (a.endpoint === favEndpoint) {
                return -1;
            }

            return 0;
        });

        return pool;
    };

    /**
     * @param {string} method
     * @param {Array<object>} endpointsPool
     * @param {string} favEndpoint
     * @param {...} args
     * @return {RequestChain}
     */
    const createRequestsChain = (method, endpointsPool, favEndpoint, ...args) => {
        const requestsChain = new RequestsChain();
        if (favEndpoint) {
            endpointsPool = getEndpointsSortedByFav(endpointsPool, favEndpoint);
        }
        for (const endpointConfig of endpointsPool) {
            const service = endpointConfig.service;
            requestsChain.add(service, method, args);
        }

        return requestsChain;
    };

    ////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////
    this.addBrickStorageEndpoint = (endpoint, serviceName) => {
        createService(brickEndpoints, endpoint, serviceName);
    }

    this.addAliasingEndpoint = (endpoint, serviceName) => {
        createService(aliasEndpoints, endpoint, serviceName);
    }

    this.getBrick = (favEndpoint, dlDomain, hash, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint, BRICK_STORAGE);
        }
        const requestsChain = createRequestsChain('getBrick', brickEndpoints, favEndpoint, dlDomain, hash);
        requestsChain.execute(callback);
    }

    this.getMultipleBricks = (favEndpoint, dlDomain, hashes, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint, BRICK_STORAGE);
        }
        const requestsChain = createRequestsChain('getMultipleBricks', brickEndpoints, favEndpoint, dlDomain, hashes);
        requestsChain.execute(callback);
    }

    this.putBrick = (favEndpoint, dlDomain, brick, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint, BRICK_STORAGE);
        }
        const requestsChain = createRequestsChain('putBrick', brickEndpoints, favEndpoint, dlDomain, brick);
        requestsChain.execute(callback);
    }

    this.getAnchors = (favEndpoint, alias, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addAliasingEndpoint(favEndpoint, ANCHOR_SERVICE);
        }
        const requestsChain = createRequestsChain('getAnchors', aliasEndpoints, favEndpoint, alias);
        requestsChain.execute(callback);
    }

    this.updateAnchor = (favEndpoint, alias, value, lastValue, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addAliasingEndpoint(favEndpoint, ANCHOR_SERVICE);
        }
        const requestsChain = createRequestsChain('updateAnchor', aliasEndpoints, favEndpoint, alias, value, lastValue);
        requestsChain.execute(callback);
    }
    initialize();
}

module.exports = BootstrapingService;
