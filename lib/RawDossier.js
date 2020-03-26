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
        const defaultOpts = {encrypt: true, ignoreMounts: true};
        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        Object.assign(defaultOpts, options);
        options = defaultOpts;

        if (options.ignoreMounts === true) {
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
        const defaultOpts = {encrypt: true, ignoreMounts: true};
        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        Object.assign(defaultOpts, options);
        options = defaultOpts;

        if (options.ignoreMounts === true) {
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

    this.writeFile = (path, data, options, callback) => {
        const defaultOpts = {encrypt: true, ignoreMounts: true};
        if (typeof options === "function") {
            callback = options;
            options = {};
        }

        Object.assign(defaultOpts, options);
        options = defaultOpts;
        if (options.ignoreMounts === true) {
            bar.writeFile(path, data, options, callback);
        } else {
            loadBarForPath(path, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.writeFile(dossierContext.relativePath, data, options, callback);
            });
        }
    };

    this.listFiles = (path, callback) => {
        loadBarForPath(path, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.listFiles(dossierContext.relativePath, (err, files) => {
                if (err) {
                    return callback(err);
                }

                if (path !== "/" && path !== "" && typeof path !== "function") {
                    files = files.map(file => {
                        if (file[0] === "/") {
                            file = file.slice(1);
                        }

                        return file;
                    })
                }

                callback(undefined, files);
            });
        });
    };

    this.mount = (path, name, archiveIdentifier, callback) => {
        if (/\w/.test(name) === false) {
            return callback(Error("Invalid mount name"));
        }

        bar.readFile(constants.MANIFEST_FILE, (err, data) => {
            let manifest;
            if (err) {
                manifest = {};
                manifest.mounts = [];
            }

            if (data) {
                manifest = JSON.parse(data.toString());
                const existingMount = manifest.mounts.find(el => el.localPath === path && el.mountName === name);
                if (existingMount) {
                    return callback(Error(`A mount point at path ${path} with the name ${name} already exists.`));
                }
            }

            const mount = {};
            mount.localPath = path;
            mount.mountName = name;
            mount.archiveIdentifier = archiveIdentifier;

            manifest.mounts.push(mount);

            bar.writeFile(constants.MANIFEST_FILE, JSON.stringify(manifest), {encrypt: true}, callback);
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

    this.listMountedDossiers = (path, callback) => {
        loadBarForPath(path, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.readFile(constants.MANIFEST_FILE, (err, manifestContent) => {
                if (err) {
                    return callback(err);
                }

                let manifest;
                try {
                    manifest = JSON.parse(manifestContent.toString());
                } catch (e) {
                    return callback(e);
                }

                const matchingMounts = [];
                manifest.mounts.forEach(mount => {
                    let sep = mount.localPath === "/" ? "" : "/";
                    let pth = mount.localPath + sep + mount.mountName;

                    if (pth.startsWith(dossierContext.relativePath)) {
                        if (path !== "/" && path !== "" && typeof path !== "function" && pth[0] === "/") {
                            pth = pth.slice(1);
                        }

                        matchingMounts.push({path: pth, dossierReference: mount.archiveIdentifier});
                    }
                });
                callback(undefined, matchingMounts);
            });
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
        if (typeof path === "function") {
            callback = path;
            path = "/";
        }
        __loadBarForPathRecursively(bar, "", path, callback);

        function __loadBarForPathRecursively(archive, prefixPath, relativePath, callback) {
            if (relativePath === "" || relativePath === "/") {
                return callback(undefined, {archive, prefixPath, relativePath});
            }

            archive.listFiles((err, files) => {
                if (err) {
                    return callback(err);
                }

                if (files.length === 0) {
                    __searchInManifest();
                }

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
                    __searchInManifest();
                }

                function __searchInManifest() {
                    let pathRest = [];
                    let splitPath = relativePath.split("/");
                    if (splitPath[0] === "") {
                        splitPath[0] = "/";
                    }
                    archive.readFile("/" + constants.MANIFEST_FILE, (err, manifestContent) => {
                        if (err) {
                            return callback(err);
                        }

                        const manifest = JSON.parse(manifestContent.toString());
                        pathRest.unshift(splitPath.pop());
                        if (splitPath.length === 0) {
                            return callback(undefined, {archive, prefixPath, relativePath});
                        }

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
                                    pathRest.shift();

                                    const internalArchive = createBar(mount.archiveIdentifier);
                                    return __loadBarForPathRecursively(internalArchive, splitPath.join("/"), pathRest.join("/"), callback);
                                }
                            }

                            pathRest.unshift(splitPath.pop());
                            if (splitPath.length === 0) {
                                return callback(Error(`Path ${path} could not be found.`));
                            }
                        }
                    });
                }
            });
        }
    }
}

module.exports = RawDossier;