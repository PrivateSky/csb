const HTTPBrickTransportStrategy = require("./brickTransportStrategies/HTTPBrickTransportStrategy");
HTTPBrickTransportStrategy.prototype.HTTP_BRICK_TRANSPORT_STRATEGY = "HTTP_BRICK_TRANSPORT_STRATEGY";

module.exports = {
    CSB: {
        CONSTITUTION_FOLDER: 'constitution',
        BLOCKCHAIN_FOLDER: 'blockchain',
        APP_FOLDER: 'app',
        DOMAIN_IDENTITY_FILE: 'domain_identity',
        ASSETS_FOLDER: "assets",
        TRANSACTIONS_FOLDER: "transactions",
        APPS_FOLDER: "apps",
        DATA_FOLDER: "data",
        MANIFEST_FILE: "manifest"
    }
};
