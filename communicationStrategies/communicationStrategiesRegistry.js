module.exports.createCommunicationStrategy = (strategyName) => {
    const DirectCommunicationStrategy = require("./DirectCommunicationStrategy");

    switch (strategyName) {
        case "direct":
            return new DirectCommunicationStrategy();
        case "isolate":
            break;
        default:
    }
};