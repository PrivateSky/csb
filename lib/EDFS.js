function EDFS(brickTransportStrategyName) {
    const RawCSB = require("./RawCSB");
    const barModule = require("bar");

    this.createCSB = (callback) => {
        const rawCSB = new RawCSB(brickTransportStrategyName);
        rawCSB.start(err => callback(err, rawCSB));
    };

    this.createBar = () => {
        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(brickTransportStrategyName);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", barModule.createFsAdapter);
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", require("edfs-brick-storage").create);
        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", brickTransportStrategy);
        archiveConfigurator.setSeedEndpoint(brickTransportStrategy.getLocator());
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");

        return barModule.createArchive(archiveConfigurator);
    };

    this.loadCSB = (seed, callback) => {

    };

    this.loadBar = (seed, callback) => {

    };
}

module.exports = EDFS;