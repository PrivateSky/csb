function EDFS(endpoint) {
    const RawDossier = require("./RawDossier");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");
    const constants = require('../moduleConstants');
    const self = this;

    this.createCSB = () => {
        return new RawDossier(endpoint);
    };

    this.createBar = () => {
        return barModule.createArchive(createArchiveConfig());
    };

    this.bootCSB = (seed, callback) => {
        const rawDossier = new RawDossier(endpoint, seed);
        rawDossier.start(err => callback(err, rawDossier));
    };

    this.loadBar = (seed) => {
        return barModule.createArchive(createArchiveConfig(seed));
    };

    this.clone = (seed, callback) => {
        const edfsBrickStorage = require("edfs-brick-storage").create(endpoint);
        const bar = this.loadBar(seed);
        bar.clone(edfsBrickStorage, true, callback);
    };

    this.createWallet = (templateSeed, pin, overwrite = false, callback) => {
        const wallet = this.createCSB();
        wallet.mount("", constants.CSB.CONSTITUTION_FOLDER, templateSeed, (err => {
            if (err) {
                return callback(err);
            }

            const seed = wallet.getSeed();
            if (typeof pin !== "undefined") {
                require("../seedCage").putSeed(seed, pin, overwrite, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(undefined, seed.toString());
                });
            } else {
                callback(undefined, seed.toString());
            }
        }));
    };

    this.loadWallet = function (walletSeed, pin, overwrite, callback) {
        if (typeof overwrite === "function") {
            callback = overwrite;
            overwrite = pin;
            pin = walletSeed;
            walletSeed = undefined;
        }
        if (typeof walletSeed === "undefined") {
            require("../seedCage").getSeed(pin, (err, seed) => {
                if (err) {
                    return callback(err);
                }
                try {
                    let wallet = this.loadBar(seed);
                    return callback(undefined, wallet);
                } catch (err) {
                    return callback(err);
                }
            });
        } else {
            let wallet;
            try {
                wallet = this.loadBar(walletSeed);
                if (typeof pin !== "undefined" && pin !== null) {
                    require("../seedCage").putSeed(walletSeed, pin, overwrite, (err) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(undefined, wallet);
                    });
                } else {
                    return callback(undefined, wallet);
                }
            } catch (err) {
                return callback(err);
            }
        }
    };

    this.createBarWithConstitution = function (folderConstitution, callback) {
        const bar = this.createBar();
        bar.addFolder(folderConstitution, constants.CSB.CONSTITUTION_FOLDER, (err, mapDigest) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, bar);
        });
    };
//------------------------------------------------ internal methods -------------------------------------------------
    function createArchiveConfig(seed) {
        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", fsAdapter.createFsAdapter);
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", require("edfs-brick-storage").create);
        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", endpoint);
        archiveConfigurator.setBufferSize(65535);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");

        if (seed) {
            archiveConfigurator.setSeed(seed);
        } else {
            archiveConfigurator.setSeedEndpoint(endpoint);
        }

        return archiveConfigurator;
    }
}

module.exports = EDFS;