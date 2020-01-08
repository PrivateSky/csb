module.exports = {
    createEDFS(communicationStrategy) {
        const EDFS = require("./lib/EDFS");
        return new EDFS(communicationStrategy);
    },

    createCommunicationStrategy(strategyName) {
        return require("./communicationStrategies/communicationStrategiesRegistry").createCommunicationStrategy(strategyName);
    }
};




