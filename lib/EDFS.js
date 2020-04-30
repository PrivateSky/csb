function EDFS(endpoint, options) {
    options = options || {};

    const RawDossier = require("./RawDossier");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");
    const constants = require('../moduleConstants');
    const cache = options.cache;

    this.createRawDossier = () => {
        return new RawDossier(endpoint, undefined, cache);
    };

    this.createBar = () => {
        return barModule.createArchive(createArchiveConfig());
    };

    this.bootRawDossier = (seed, callback) => {
        const rawDossier = new RawDossier(endpoint, seed, cache);
        rawDossier.start(err => callback(err, rawDossier));
    };

    this.loadRawDossier = (seed) => {
        return new RawDossier(endpoint, seed, cache);
    };

    this.loadBar = (seed) => {
        return barModule.createArchive(createArchiveConfig(seed));
    };

    this.clone = (seed, callback) => {
        const edfsBrickStorage = require("edfs-brick-storage").create(endpoint);
        const bar = this.loadBar(seed);
        bar.clone(edfsBrickStorage, true, callback);
    };

    this.createWallet = (templateSeed, password, overwrite, callback) => {
        if (typeof overwrite === "function") {
            callback = overwrite;
            overwrite = false;
        }
        const wallet = this.createRawDossier();
        wallet.mount("/" + constants.CSB.CODE_FOLDER, constants.CSB.CONSTITUTION_FOLDER, templateSeed, (err => {
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
                let rawDossier = this.loadRawDossier(seed);

                if (!rawDossier) {
                    return callback(new Error("RawDossier is not available"));
                }
                return callback(undefined, rawDossier);

            });
        } else {

            let rawDossier = this.loadRawDossier(walletSeed);

            if (!rawDossier) {
                return callback(new Error("RawDossier is not available"));
            }


            if (typeof password !== "undefined" && password !== null) {
                require("../seedCage").putSeed(walletSeed, password, overwrite, (err) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(undefined, rawDossier);
                });
            } else {
                return callback(undefined, rawDossier);
            }
        }
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
