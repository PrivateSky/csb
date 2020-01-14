function BrickTransportStrategiesRegistry() {
    const strategies = {};

    this.add = (transportStrategyName, strategy) => {
        if (typeof strategies[transportStrategyName] === "undefined") {
            strategies[transportStrategyName] = strategy;
        }else{
            throw Error(`A strategy with the name "${transportStrategyName}" already registered.`)
        }
    };

    this.remove = (transportStrategyName) => {
        strategies[transportStrategyName] = undefined;
    };

    this.get = (transportStrategyName) => {
        return strategies[transportStrategyName];
    };

    this.has = (transportStrategyName) => {
        return strategies.hasOwnProperty(transportStrategyName);
    }
}

if (!$$.brickTransportStrategiesRegistry) {
    $$.brickTransportStrategiesRegistry = new BrickTransportStrategiesRegistry();
}