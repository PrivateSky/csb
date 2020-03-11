/*

Sinica: to be renamed CSBHandler. RootCSB should be deleted
*/

function RawDossier(endpoint, seed) {
    const barModule = require("bar");
    const blockchainModule = require("blockchain");
    const constants = require("../moduleConstants").CSB;
    let bar = createBar();
    this.getSeed = () => {
        return bar.getSeed();
    };

    this.start = (callback) => {
        createBlockchain(bar).start(callback);
    };

    this.addFolder = (fsFolderPath, barPath, callback) => {
        bar.addFolder(fsFolderPath, barPath, (err, barMapDigest) => callback(err, barMapDigest));
    };

    this.addFile = (fsFilePath, barPath, callback) => {
        bar.addFile(fsFilePath, barPath, (err, barMapDigest) => callback(err, barMapDigest));
    };

    this.readFile = bar.readFile;

    this.extractFolder = bar.extractFolder;

    this.extractFile = bar.extractFile;

    this.writeFile = (barPath, data, callback) => {
        bar.writeFile(barPath, data, (err, barMapDigest) => callback(err, barMapDigest));
    };

    this.listFiles = bar.listFiles;

    this.mount = (path, name, archiveIdentifier, callback) => {
        bar.readFile(constants.MANIFEST_FILE, (err, data) => {
            let manifest;
            if (err) {
                manifest = {};
                manifest.mounts = [];
            }

            if(data){
                manifest = JSON.parse(data.toString());
                const pathNames= manifest.mounts.filter (el => el.localPath === path);
                const index = pathNames.findIndex(el => el === name);
                if (index >= 0) {
                    return callback(Error(`A mount point at path ${path} with the name ${name} already exists.`));
                }
            }

            const mount = {};
            mount.localPath = path;
            mount.mountName = name;
            mount.archiveIdentifier = archiveIdentifier;

            manifest.mounts.push(mount);

            bar.writeFile(constants.MANIFEST_FILE, JSON.stringify(manifest), callback);
        });
    };

    this.unmount = (path, name, callback) => {
        bar.readFile(constants.MANIFEST_FILE, (err, data) => {
            if (err) {
                return callback(err);
            }

            if (data.length === 0) {
                return callback(Error("Nothing to unmount"));
            }

            const manifest = JSON.parse(data.toString());
            const index = manifest.mounts.findIndex(el => el.localPath === path);
            if (index >= 0) {
                manifest.mounts.splice(index, 1);
            } else {
                return callback(Error(`No mount point exists at path ${path}`));
            }

            callback();
        });
    };

    //------------------------------------------------- internal functions ---------------------------------------------
    function createBlockchain(bar) {
        const worldStateCache = blockchainModule.createWorldStateCache("bar", bar);
        const historyStorage = blockchainModule.createHistoryStorage("bar", bar);
        const consensusAlgorithm = blockchainModule.createConsensusAlgorithm("direct");
        const signatureProvider = blockchainModule.createSignatureProvider("permissive");
        return blockchainModule.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true);
    }

    function createBar() {
        const createEDFSBrickStorage = require("edfs-brick-storage").create;
        const createFsAdapter = require("bar-fs-adapter").createFsAdapter;

        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);

        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");

        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setBufferSize(65535);
        if (!seed) {
            archiveConfigurator.setStorageProvider("EDFSBrickStorage", endpoint);
            archiveConfigurator.setSeedEndpoint(endpoint);
        } else {
            archiveConfigurator.setSeed(seed);
        }

        return barModule.createArchive(archiveConfigurator);
    }
}

module.exports = RawDossier;