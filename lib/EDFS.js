function EDFS(brickTransportStrategyName) {
    const RawCSB = require("./RawCSB");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");
    const constants = require('../moduleConstants');

    this.createCSB = (callback) => {
        const rawCSB = new RawCSB(brickTransportStrategyName);
        rawCSB.start(err => {
            if(err) {
                return callback(err);
            }

            // callback(undefined, rawCSB);

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

    this.clone = (seed, callback) => {
        throw new Error('Not implemented');
    };

    this.createBarWithConstitution = function(folderConstitution, callback) {
        const bar = this.createBar();
        // const fs = require('fs');
        // const path = require('path');
        //
        // fs.readdir(folderConstitution, (err, files) => {
        //    if (err) {
        //        return callback(err);
        //    }
        //
        //    function __readNextFile(index = 0) {
        //        if(index >= files.length) {
        //            return callback(undefined, bar);
        //        }
        //
        //        bar.addFile(path.join(folderConstitution, files[index]), `${constants.CSB.CONSTITUTION_FOLDER}/${files[index]}`, (err) => {
        //            if(err) {
        //                return callback(err);
        //            }
        //
        //            __readNextFile(index + 1);
        //        })
        //    }
        //
        //     __readNextFile();
        // });

        // TODO: fix this
        bar.addFolder(folderConstitution, constants.CSB.CONSTITUTION_FOLDER, (err, mapDigest) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, bar);
        });
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
            archiveConfigurator.setBrickTransportStrategyName(brickTransportStrategyName);
            archiveConfigurator.setSeed(seed);
        }else{
            archiveConfigurator.setSeedEndpoint(brickTransportStrategy.getLocator());
        }

        return archiveConfigurator;
    }
}

module.exports = EDFS;