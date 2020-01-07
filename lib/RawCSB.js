function RawCSB() {
    const barModule = require("bar");
    const blockchainModule = require("blockchain");

    let bar = createBar();
    let blockchain = createBlockchain(bar);
    let started = false;
    let seed;

    this.getSeed = () => {
        return seed;
    };

    this.addFolder = bar.addFolder;

    this.addFile = bar.addFile;

    this.readFile = bar.readFile;

    this.extractFolder = bar.extractFolder;

    this.extractFile = bar.extractFile;

    this.writeFile = (barPath, data, callback) => {
        checkBlockchainStarted(callback);

        bar.writeFile(barPath, data, (err, barMapDigest) => {
            if (err) {
                return callback(err);
            }

            bar.getFileHash(barPath, (err, fileDigest) => {
                if (err) {
                    return callback(err);
                }

                const transaction = blockchain.startTransactionAs($$.securityContext.getCurrentAgentIdentity(), "StandardCSBTransactions", "addFileAnchor", barPath, fileDigest);
                transaction.onCommit(err => callback(err, barMapDigest));
            });
        });
    };

    this.listFiles = bar.listFiles;

    this.startTransactionAs = (agentId, transactionType, ...args) => {
        checkBlockchainStarted();
        blockchain.startTransactionAs(agentId, transactionType, ...args);
    };

    this.lookup = (assetType, aid) => {
        checkBlockchainStarted();
        return blockchain.lookup(assetType, aid);
    };

    this.commit = (transaction) => {
        checkBlockchainStarted();
        blockchain.commit(transaction);
    };

    //------------------------------------------------- internal functions ---------------------------------------------
    function createBlockchain(bar) {
        const worldStateCache = blockchainModule.createWorldStateCache("memory");
        const historyStorage = blockchainModule.createHistoryStorage("bar", bar);
        const consensusAlgorithm = blockchainModule.createConsensusAlgorithm("direct");
        const signatureProvider = blockchainModule.createSignatureProvider("permissive");
        return blockchainModule.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true);
    }

    function createBar() {
        const createEDFSBrickStorage = require("edfs-brick-storage").createEDFSBrickStorage;
        const createFsAdapter = require("bar-fs-adapter").createFsAdapter;

        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);

        const archiveConfigurator = new ArchiveConfigurator();
        const endpoint = "http://localhost:9097";
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", endpoint);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setBufferSize(2);
        archiveConfigurator.setSeedEndpoint(endpoint);
        return barModule.createArchive(archiveConfigurator);
    }

    function checkBlockchainStarted(callback) {
        if (!started) {
            if (callback) {
                return callback(Error("Blockchain was not started"))
            } else {
                throw Error("Blockchain was not started");
            }
        }
    }

}

module.exports = RawCSB;