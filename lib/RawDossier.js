function RawDossier(endpoint, seed, cache) {
    const barModule = require("bar");
    const constants = require("../moduleConstants").CSB;
    const swarmutils = require("swarmutils");
    const TaskCounter = swarmutils.TaskCounter;
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
            bar.addFolder(fsFolderPath, barPath, options, callback);
        } else {
            const splitPath = barPath.split("/");
            const folderName = splitPath.pop();
            barPath = splitPath.join("/");
            loadBarForPath(barPath, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.addFolder(fsFolderPath, dossierContext.relativePath + "/" + folderName, options, callback);
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
            bar.addFile(fsFilePath, barPath, options, (err, barMapDigest) => callback(err, barMapDigest));
        } else {
            const splitPath = barPath.split("/");
            const fileName = splitPath.pop();
            barPath = splitPath.join("/");
            loadBarForPath(barPath, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }

                dossierContext.archive.addFile(fsFilePath, dossierContext.relativePath + "/" + fileName, options, callback);
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

    this.createReadStream = (fileBarPath, callback) => {
        loadBarForPath(fileBarPath, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.createReadStream(dossierContext.relativePath, callback);
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
        if (path.split("/").includes(constants.MANIFEST_FILE)) {
            return callback(Error("Trying to overwrite the manifest file. This is not allowed"));
        }
        if (options.ignoreMounts === true) {
            bar.writeFile(path, data, options, callback);
        } else {
            const splitPath = path.split("/");
            const fileName = splitPath.pop();
            path = splitPath.join("/");
            loadBarForPath(path, (err, dossierContext) => {
                if (err) {
                    return callback(err);
                }
                if (dossierContext.readonly === true) {
                    return callback(Error("Tried to write in a readonly mounted RawDossier"));
                }

                dossierContext.archive.writeFile(dossierContext.relativePath + "/" + fileName, data, options, callback);
            });
        }
    };

    this.delete = (barPath, callback) => {
        bar.delete(barPath, callback);
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

    this.listFolders = (path, callback) => {
        loadBarForPath(path, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            dossierContext.archive.listFolders(dossierContext.relativePath, (err, folders) => {
                if (err) {
                    return callback(err);
                }

                callback(undefined, folders);
            });
        });
    };

    this.readDir = (folderPath, options, callback) => {
        if (typeof options === "function") {
            callback = options;
            options = {
                withFileTypes: false
            };
        }
        loadBarForPath(folderPath, (err, dossierContext) => {
            if (err) {
                return callback(err);
            }

            const taskCounter = new TaskCounter((errors, results) => {
                let entries;
                if (options.withFileTypes === true) {
                    entries = {};
                    results.forEach(res=> {
                        let entryType = Object.keys(res)[0];
                        entries[entryType] = res[entryType];
                    })
                }else{
                    entries = [];
                    results.forEach(res => {
                        entries = entries.concat(Object.values(res)[0])
                    });
                }


                callback(undefined, entries);
            });

            taskCounter.increment(3);
            dossierContext.archive.listFolders(dossierContext.relativePath, false, (err, folders) => {
                if (err) {
                    taskCounter.decrement(undefined, {folders:[]});
                    return;
                }

                folders = folders.map(folder => {
                    if (folder[0] === "/") {
                        return folder.slice(1);
                    }

                    return folder;
                });
                taskCounter.decrement(undefined, {folders: folders});
            });

            dossierContext.archive.listFiles(dossierContext.relativePath, false, (err, files) => {
                if (err) {
                    taskCounter.decrement(undefined, {files: []});
                    return;
                }

                files = files.map(file => {
                    if (file[0] === "/") {
                        return file.slice(1);
                    }

                    return file;
                });
                taskCounter.decrement(undefined, {files: files});
            });

            this.listMountedDossiers("/", (err, mountedDossiers) => {
                if (err) {
                    taskCounter.decrement(undefined, {mounts: []});
                    return;
                }

                const mountPaths = mountedDossiers.map(dossier => {
                    const pathSegments = dossier.path.split("/");
                    if (pathSegments[0] === "") {
                        pathSegments.shift();
                    }
                    if (pathSegments.length > 0) {
                        return pathSegments[0];
                    }
                });

                taskCounter.decrement(undefined, {mounts: mountPaths});
            });
        });
    };

    this.mount = (path, name, archiveIdentifier, readonly, callback) => {
        if (typeof readonly === "function") {
            callback = readonly;
            readonly = false;
        }
        if (/\W-_/.test(name) === true) {
            return callback(Error("Invalid mount name"));
        }

        bar.listFiles(path, (err, files) => {
            if (!err && files.length > 0) {
                return callback(Error("Tried to mount in a non-empty folder"));
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
                mount.readonly = readonly;
                manifest.mounts.push(mount);

                bar.writeFile(constants.MANIFEST_FILE, JSON.stringify(manifest), {encrypt: true}, callback);
            });
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
        archiveConfigurator.setCache(cache);

        return barModule.createArchive(archiveConfigurator);
    }

    function loadBarForPath(path, callback) {
        if (typeof path === "function") {
            callback = path;
            path = "/";
        }

        __loadBarForPathRecursively(bar, "", path, false, callback);

        function __loadBarForPathRecursively(archive, prefixPath, relativePath, readonly, callback) {
            if (relativePath === "" || relativePath === "/") {
                return callback(undefined, {archive, prefixPath, readonly, relativePath});
            }

            archive.listFiles((err, files) => {
                if (err) {
                    return callback(err);
                }

                if (files.length === 0) {
                    __searchInManifest();
                } else {
                    let barPath = files.find(file => {
                        return file.includes(relativePath) || relativePath.includes(file);
                    });

                    if (barPath) {
                        return callback(undefined, {archive, prefixPath, readonly, relativePath});
                    } else {
                        __searchInManifest();
                    }

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
                            return callback(undefined, {archive, prefixPath, readonly, relativePath});
                        }

                        while (splitPath.length > 0) {
                            let localPath;
                            if (splitPath[0] === "/") {
                                while (splitPath[0] === "/") {
                                    splitPath.shift();
                                }
                                localPath = "/" + splitPath.join("/");
                            } else {
                                localPath = splitPath.join("/");
                            }

                            for (let mount of manifest.mounts) {
                                const name = pathRest[0];
                                if (mount.localPath === localPath && mount.mountName === name) {
                                    pathRest.shift();

                                    let newPath;
                                    if (prefixPath.endsWith("/") || prefixPath === "") {
                                        newPath = prefixPath + localPath + "/" + name;
                                    } else {
                                        newPath = prefixPath + "/" + localPath + "/" + name;
                                    }
                                    const internalArchive = createBar(mount.archiveIdentifier);
                                    let remainingPath = pathRest.join("/");
                                    if (remainingPath[0] !== "/") {
                                        //when navigate into an archive we need to ensure that the remainingPath starts with /
                                        remainingPath = "/" + remainingPath;
                                    }
                                    return __loadBarForPathRecursively(internalArchive, newPath, remainingPath, mount.readonly, callback);
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
