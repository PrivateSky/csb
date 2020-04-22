function BrickTransportStrategiesRegistry() {
    const strategies = {};

    this.remove = (transportStrategyName) => {
        strategies[transportStrategyName] = undefined;
    };

    this.add = (transportStrategyName, strategy) => {
        if (typeof strategy.prototype.canHandleEndpoint === "function") {
            strategies[transportStrategyName] = strategy;
        } else {
            throw Error("Missing function from strategy prototype");
        }
    };

    this.get = (endpoint) => {
        if (typeof endpoint !== "string" || endpoint.length === 0) {
            throw Error(`Invalid endpoint ${endpoint}, ${typeof endpoint} ${Buffer.isBuffer(endpoint)}`);
        }

        const strategyName = getStrategyNameFromEndpoint(endpoint);
        if (!strategyName) {
            throw Error(`No strategy available to handle endpoint ${endpoint}`);
        }

        return new strategies[strategyName](endpoint);
    };

    this.has = (transportStrategyName) => {
        return strategies.hasOwnProperty(transportStrategyName);
    };

    function getStrategyNameFromEndpoint(endpoint) {
        for(let key in strategies){
            if (strategies[key] && strategies[key].prototype.canHandleEndpoint(endpoint)) {
                return key;
            }
        }
    }
}

if (!$$.brickTransportStrategiesRegistry) {
    $$.brickTransportStrategiesRegistry = new BrickTransportStrategiesRegistry();
}