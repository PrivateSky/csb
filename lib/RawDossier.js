/*

Sinica: to be renamed CSBHandler. RootCSB should be deleted
*/

function RawDossier(endpoint, seed) {
    const barModule = require("bar");
    const constants = require("../moduleConstants").CSB;
    let bar = createBar(seed);
    this.getSeed = () => {
        return bar.getSeed();
    };

    this.start = (callback) => {
        createBlockchain(bar).start(callback);
    };

    this.addFolder = (fsFolderPath, barPath, options, callback) => {
        if (typeof options === "function") {
            callback = options;
            options = {};
            options.isEncrypted = true;
        }

        if (options.depth === 0) {
            bar.addFolder(fsFolderPath, barPath, options, (err, barMapDigest) => callback(err, barMapDigest));
        } else {
            loadBarForPath(barPath, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.addFolder(fsFolderPath, dossierContext.relativePath, options, callback);
            });
        }
    };

    this.addFile = (fsFilePath, barPath, options, callback) => {
        if (typeof options === "function") {
            callback = options;
            options = {};
            options.isEncrypted = true;
        }
        if (options.depth === 0) {
            bar.addFolder(fsFilePath, barPath, options, (err, barMapDigest) => callback(err, barMapDigest));
        } else {
            loadBarForPath(barPath, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.addFile(fsFilePath, dossierContext.relativePath, options, callback);
            });
        }
    };

    this.readFile = (fileBarPath, callback) => {

        loadBarForPath(fileBarPath, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.readFile(dossierContext.relativePath, callback);
        });
    };

    this.extractFolder = (fsFolderPath, barPath, callback) => {
        loadBarForPath(barPath, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.extractFolder(fsFolderPath, dossierContext.relativePath, callback);
        });
    };

    this.extractFile = (fsFilePath, barPath, callback) => {
        loadBarForPath(barPath, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.extractFile(fsFilePath, dossierContext.relativePath, callback);
        });
    };

    this.writeFile = (path, data, depth, callback) => {
        if (typeof depth === "function") {
            callback = depth;
            depth = undefined;
        }

        if (depth === 0) {
            bar.writeFile(path, data, callback);
        } else {
            loadBarForPath(path, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.writeFile(dossierContext.relativePath, data, callback);
            });
        }
    };

    this.listFiles = (path, callback) => {
        loadBarForPath(path, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.listFiles(dossierContext.relativePath, callback);
        });
    };

    this.mount = (path, name, archiveIdentifier, callback) => {
        bar.readFile(constants.MANIFEST_FILE, (err, data) => {
            let manifest;
            if (err) {
                manifest = {};
                manifest.mounts = [];
            }

            if (data) {
                manifest = JSON.parse(data.toString());
                const pathNames = manifest.mounts.filter(el => el.localPath === path);
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

            bar.writeFile(constants.MANIFEST_FILE, JSON.stringify(manifest), callback);
        });
    };

    //------------------------------------------------- internal functions ---------------------------------------------
    function createBlockchain(bar) {
        const blockchainModule = require("blockchain");
        const worldStateCache = blockchainModule.createWorldStateCache("bar", bar);
        const historyStorage = blockchainModule.createHistoryStorage("bar", bar);
        const consensusAlgorithm = blockchainModule.createConsensusAlgorithm("direct");
        const signatureProvider = blockchainModule.createSignatureProvider("permissive");
        return blockchainModule.createBlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true);
    }

    function createBar(localSeed) {
        const createEDFSBrickStorage = require("edfs-brick-storage").create;
        const createFsAdapter = require("bar-fs-adapter").createFsAdapter;

        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);

        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");

        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setBufferSize(65535);
        if (!localSeed) {
            archiveConfigurator.setStorageProvider("EDFSBrickStorage", endpoint);
            archiveConfigurator.setSeedEndpoint(endpoint);
        } else {
            archiveConfigurator.setSeed(localSeed);
        }

        return barModule.createArchive(archiveConfigurator);
    }

    function loadBarForPath(path, callback) {
        __loadBarForPathRecursively(bar, "", path, callback);

        function __loadBarForPathRecursively(archive, prefixPath, relativePath, callback) {
            archive.listFiles((err, files) => {
                if (err) {
                    return callback(err);
                }

                if (files.length === 0) {
                    return callback();
                }

                let pathRest = [];

                let barPath = files.find(file => {
                    let pth;
                    if (relativePath[0] === "/") {
                        if (prefixPath === "/") {
                            pth = relativePath;
                        } else {
                            pth = prefixPath + relativePath
                        }
                    } else {
                        if (prefixPath === "/") {
                            pth = prefixPath + relativePath;
                        } else {
                            pth = prefixPath + "/" + relativePath;
                        }
                    }
                    return file.startsWith(pth);
                });
                if (barPath) {
                    return callback(undefined, {archive, prefixPath, relativePath});
                } else {
                    let splitPath = relativePath.split("/");
                    if (splitPath[0] === "") {
                        splitPath[0] = "/";
                    }
                    archive.readFile(constants.MANIFEST_FILE, (err, manifestContent) => {
                        if (err) {
                            return callback(err);
                        }

                        const manifest = JSON.parse(manifestContent.toString());
                        pathRest.unshift(splitPath.pop());
                        while (splitPath.length > 0) {
                            let localPath;
                            if (splitPath[0] === "/") {
                                splitPath.shift();
                                localPath = "/" + splitPath.join("/");
                                splitPath.unshift("/");
                            } else {
                                localPath = splitPath.join("/");
                            }

                            for (let mount of manifest.mounts) {
                                const name = pathRest[0];
                                if (mount.localPath === localPath && mount.mountName === name) {
                                    const internalArchive = createBar(mount.archiveIdentifier);
                                    return __loadBarForPathRecursively(internalArchive, splitPath.join("/"), pathRest.join("/"), callback);
                                }
                            }

                            pathRest.unshift(splitPath.pop());
                        }
                    });
                }
            });
        }
    }
}

module.exports = RawDossier;