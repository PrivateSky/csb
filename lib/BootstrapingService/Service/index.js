const services = {
    'brickStorage': require('edfs-brick-storage').create,
    'anchorService': require('edfs-brick-storage').create
}

function isValid(protocolName) {
    return Object.keys(services).indexOf(protocolName) !== -1;
}

function factory(name, config) {
    config = config || {};
    return services[name](config.endpoint);
}

module.exports = {
    isValid,
    factory
};
