'use strict';

const Protocol = require('./Protocol');
const RequestsChain = require('./RequestsChain');

function Service(options) {
    options = options || {};

    const brickEndpoints = [];
    const aliasEndpoints = [];

    ////////////////////////////////////////////////////////////
    // Private methods
    ////////////////////////////////////////////////////////////
    const initialize = () => {
        if (Array.isArray(options.brickEndpoints)) {
            for (const endpointConfig of options.brickEndpoints) {
                const { endpoint, protocol } = endpointConfig;
                this.addBrickStorageEndpoint(endpoint, protocol);
            }
        }

        if (Array.isArray(options.aliasEndpoints)) {
            for (const endpointConfig of options.aliasEndpoints) {
                const { endpoint, protocol } = endpointConfig;
                this.addAliasingEndpoint(endpoint, protocol);
            }
        }
    };

    /**
     * @param {Array<object>} pool
     * @param {string} endpoint
     * @param {string} name
     */
    const createProtocol = (pool, endpoint, name) => {
        if (typeof name === "undefined") {
            name = 'EDFS';
        }

        if (!Protocol.isValid(name)) {
            throw new Error(`Invalid protocol: ${name}`);
        }

        const foundIndex = pool.findIndex(el => el.endpoint === endpoint && el.protocolName === name);
        if (foundIndex !== -1) {
            return;
        }

        const protocol = Protocol.factory(name, {
            endpoint: endpoint
        });

        pool.push({
            endpoint,
            protocol,
            protocolName: name
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
            const protocol = endpointConfig.protocol;
            requestsChain.add(protocol, method, args);
        }

        return requestsChain;
    };

    ////////////////////////////////////////////////////////////
    // Public methods
    ////////////////////////////////////////////////////////////
    this.addBrickStorageEndpoint = (endpoint, protocolName) => {
        createProtocol(brickEndpoints, endpoint, protocolName);
    }

    this.addAliasingEndpoint = (endpoint, protocolName) => {
        createProtocol(aliasEndpoints, endpoint, protocolName);
    }

    this.getBrick = (favEndpoint, dlDomain, hash, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint);
        }
        const requestsChain = createRequestsChain('getBrick', brickEndpoints, favEndpoint, dlDomain, hash);
        requestsChain.execute(callback);
    }

    this.getMultipleBricks = (favEndpoint, dlDomain, hashes, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint);
        }
        const requestsChain = createRequestsChain('getMultipleBricks', brickEndpoints, favEndpoint, dlDomain, hashes);
        requestsChain.execute(callback);
    }

    this.putBrick = (favEndpoint, dlDomain, brick, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addBrickStorageEndpoint(favEndpoint);
        }
        const requestsChain = createRequestsChain('putBrick', brickEndpoints, favEndpoint, dlDomain, brick);
        requestsChain.execute(callback);
    }

    this.getAliasVersions = (favEndpoint, alias, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addAliasingEndpoint(favEndpoint);
        }
        const requestsChain = createRequestsChain('getAliasVersions', aliasEndpoints, favEndpoint, alias);
        requestsChain.execute(callback);
    }

    this.updateAlias = (favEndpoint, alias, value, lastValue, callback) => {
        if (typeof favEndpoint !== "undefined") {
            this.addAliasingEndpoint(favEndpoint);
        }
        const requestsChain = createRequestsChain('updateAlias', aliasEndpoints, favEndpoint, alias, value, lastValue);
        requestsChain.execute(callback);
    }
    initialize();
}

module.exports = Service;
