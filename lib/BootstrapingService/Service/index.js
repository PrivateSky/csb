const openDSU = require("opendsu");
const services = {
    'brickStorage': openDSU.loadApi("bricking"),
    'anchorService': openDSU.loadApi("anchoring")
}

function isValid(protocolName) {
    return Object.keys(services).indexOf(protocolName) !== -1;
}

function factory(name, config) {
    config = config || {};
    return services[name];
}

module.exports = {
    isValid,
    factory
};
