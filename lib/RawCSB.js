function RawCSB(brickTransportStrategyName) {
    const barModule = require("bar");
    const blockchainModule = require("blockchain");

    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(brickTransportStrategyName);
    let bar = createBar();
    let blockchain = createBlockchain(bar);
    let seed;


    this.getSeed = () => {
        return bar.getSeed();
    };

    this.start = (callback) => {
        blockchain.start(callback);
    };

    this.addFolder = bar.addFolder;

    this.addFile = bar.addFile;

    this.readFile = bar.readFile;

    this.extractFolder = bar.extractFolder;

    this.extractFile = bar.extractFile;

    this.writeFile = (barPath, data, callback) => {
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
        blockchain.startTransactionAs(agentId, transactionType, ...args);
    };

    this.lookup = (assetType, aid) => {
        return blockchain.lookup(assetType, aid);
    };

    this.commit = (transaction) => {
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
        const createEDFSBrickStorage = require("edfs-brick-storage").create;
        const createFsAdapter = require("bar-fs-adapter").createFsAdapter;

        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);

        const archiveConfigurator = new ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", brickTransportStrategyName);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setBufferSize(65535);
        archiveConfigurator.setSeedEndpoint(brickTransportStrategy.getLocator());
        return barModule.createArchive(archiveConfigurator);
    }
}

module.exports = RawCSB;