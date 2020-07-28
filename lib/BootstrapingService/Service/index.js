const services = {
    'brickStorage': require('edfs-brick-storage').createBrickStorageService,
    'anchorService': require('edfs-brick-storage').createAnchoringService
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
