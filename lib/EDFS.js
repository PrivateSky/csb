function EDFS(endpoint, options) {
    options = options || {};

    const RawDossier = require("./RawDossier");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");
    const constants = require('../moduleConstants');
    const pskPath = require("swarmutils").path;
    const cache = options.cache;

    this.createRawDossier = () => {
        return new RawDossier(endpoint, undefined, cache);
    };

    this.createBar = () => {
        return barModule.createArchive(createArchiveConfig());
    };

    this.bootRawDossier = (seed, callback) => {
        const rawDossier = new RawDossier(endpoint, seed, cache);
        rawDossier.load((err) => {
            if (err) {
                return callback(err);
            }

            rawDossier.start(err => callback(err, rawDossier));
        })
    };

    this.loadRawDossier = (seed, callback) => {
        const dossier = new RawDossier(endpoint, seed, cache);
        dossier.load((err) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, dossier);
        });
    };

    this.loadBar = (seed, callback) => {
        const bar = barModule.createArchive(createArchiveConfig(seed));
        bar.load((err) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, bar);
        });
    };

    this.clone = (seed, callback) => {
        const edfsBrickStorage = require("edfs-brick-storage").create(endpoint);
        this.loadBar(seed, (err, bar) => {
            if (err) {
                return callback(err);
            }
            bar.clone(edfsBrickStorage, true, callback);
        })
    };

    this.createWallet = (templateSeed, password, overwrite, callback) => {
        if (typeof overwrite === "function") {
            callback = overwrite;
            overwrite = false;
        }
        const wallet = this.createRawDossier();
        wallet.load((err) => {
            if (err) {
                return callback(err);
            }

            wallet.mount(pskPath.ensureIsAbsolute(pskPath.join(constants.CSB.CODE_FOLDER, constants.CSB.CONSTITUTION_FOLDER)), templateSeed, (err => {
                if (err) {
                    return callback(err);
                }

                const seed = wallet.getSeed();
                if (typeof password !== "undefined") {
                    require("../seedCage").putSeed(seed, password, overwrite, (err) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(undefined, seed.toString());
                    });
                } else {
                    callback(undefined, seed.toString());
                }
            }));
        })
    };

    this.loadWallet = function (walletSeed, password, overwrite, callback) {
        if (typeof overwrite === "function") {
            callback = overwrite;
            overwrite = password;
            password = walletSeed;
            walletSeed = undefined;
        }
        if (typeof walletSeed === "undefined") {
            require("../seedCage").getSeed(password, (err, seed) => {
                if (err) {
                    return callback(err);
                }
                this.loadRawDossier(seed, (err, dossier) => {
                    if (err) {
                        return callback(err);
                    }
                    return callback(undefined, dossier);
                });
            });
            return;
        }

        this.loadRawDossier(walletSeed, (err, dossier) => {
            if (err) {
                return callback(err);
            }

            if (typeof password !== "undefined" && password !== null) {
                require("../seedCage").putSeed(walletSeed, password, overwrite, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(undefined, dossier);
                });
            } else {
                return callback(undefined, dossier);
            }
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
        archiveConfigurator.setCache(cache);

        if (seed) {
            archiveConfigurator.setSeed(seed);
        } else {
            archiveConfigurator.setSeedEndpoint(endpoint);
        }

        return archiveConfigurator;
    }
}

module.exports = EDFS;
