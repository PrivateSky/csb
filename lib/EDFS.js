function EDFS(brickTransportStrategyName) {
    const RawCSB = require("./RawCSB");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");

    this.createCSB = (callback) => {
        const rawCSB = new RawCSB(brickTransportStrategyName);
        rawCSB.start(err => {
            if(err) {
                return callback(err);
            }

            // START: DELETE THIS WHEN FIXED
            rawCSB.startTransactionAs('anon', 'TooShortBlockChainWorkaroundDeleteThis', 'add')
                .onCommit((err) => {
                    callback(err, rawCSB)
                });
            // END: DELETE THIS WHEN FIXED
        });
    };

    this.createBar = () => {
        return barModule.createArchive(createArchiveConfig());
    };

    this.loadCSB = (seed, callback) => {
        const rawCSB = new RawCSB(brickTransportStrategyName, seed);
        rawCSB.start(err => callback(err, rawCSB));
    };

    this.loadBar = (seed) => {
        return barModule.createArchive(createArchiveConfig(seed));
    };

    function createArchiveConfig(seed) {
        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(brickTransportStrategyName);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", fsAdapter.createFsAdapter);
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", require("edfs-brick-storage").create);
        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", brickTransportStrategyName);
        archiveConfigurator.setBufferSize(65535);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");

        if (seed) {
            archiveConfigurator.setSeed(seed);
        }else{
            archiveConfigurator.setSeedEndpoint(brickTransportStrategy.getLocator())
        }

        return archiveConfigurator;
    }
}

module.exports = EDFS;