'use strict';

const protocols = {
    'EDFS': require('./EDFS')
}

function isValid(protocolName) {
    return Object.keys(protocols).indexOf(protocolName) !== -1;
}

function factory(name, config) {
    config = config || {};
    const ProtocolConstructor = protocols[name];
    return new ProtocolConstructor(config);
}

module.exports = {
    isValid,
    factory
};
