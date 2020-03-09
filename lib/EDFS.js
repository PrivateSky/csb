function EDFS(brickTransportStrategyName) {
    const RawDossier = require("./RawDossier");
    const barModule = require("bar");
    const fsAdapter = require("bar-fs-adapter");
    const constants = require('../moduleConstants');

    this.createCSB = (callback) => {
        const rawDossier = new RawDossier(brickTransportStrategyName);
        rawDossier.start(err => {
            if (err) {
                return callback(err);
            }

            // callback(undefined, rawDossier);

            // START: DELETE THIS WHEN FIXED
            rawDossier.startTransactionAs('anon', 'TooShortBlockChainWorkaroundDeleteThis', 'add')
                .onCommit((err) => {
                    callback(err, rawDossier)
                });
            // END: DELETE THIS WHEN FIXED
        });
    };

    this.createBar = () => {
        return barModule.createArchive(createArchiveConfig());
    };

    this.bootCSB = (seed, callback) => {
        const rawDossier = new RawDossier(brickTransportStrategyName, seed);
        rawDossier.start(err => callback(err, rawDossier));
    };

    this.loadBar = (seed) => {
        return barModule.createArchive(createArchiveConfig(seed));
    };

    this.clone = (seed, callback) => {
        const edfsBrickStorage = require("edfs-brick-storage").create(brickTransportStrategyName);
        const bar = this.loadBar(seed);
        bar.clone(edfsBrickStorage, true, callback);
    };

    this.createWallet = (templateSeed, pin, overwrite = false, callback) => {
        this.clone(templateSeed, (err, seed) => {
            if (err) {
                return callback(err);
            }

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
        });
    };

    this.loadWallet = function(walletSeed, pin, overwrite, callback){
        if(typeof overwrite === "function"){
            callback = overwrite;
            overwrite = pin;
            pin = walletSeed;
            walletSeed = undefined;
        }
        if(typeof  walletSeed === "undefined"){
            require("../seedCage").getSeed(pin, (err, seed)=>{
                if(err){
                    return callback(err);
                }
                try {
                    let wallet = this.loadBar(seed);
                    return callback(undefined, wallet);
                }catch(err){
                    return callback(err);
                }
            });
        }else{
            let wallet;
            try{
                wallet = this.loadBar(walletSeed);
                if(typeof pin !== "undefined" && pin !== null){
                    require("../seedCage").putSeed(walletSeed, pin, overwrite,(err)=>{
                        if(err){
                            return callback(err);
                        }
                        callback(undefined, wallet);
                    });
                }else{
                    return callback(undefined, wallet);
                }
            }catch(err){
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
        } else {
            archiveConfigurator.setSeedEndpoint(brickTransportStrategy.getLocator());
        }

        return archiveConfigurator;
    }
}

module.exports = EDFS;