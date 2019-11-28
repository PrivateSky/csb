const bm = require("blockchain");
const createEDFSBrickStorage = require("edfs-brick-storage").createEDFSBrickStorage;
const createFsAdapter = require("bar-fs-adapter").createFsAdapter;
const barModule = require("bar");
const ArchiveConfigurator = barModule.ArchiveConfigurator;
ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", createEDFSBrickStorage);
ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", createFsAdapter);

function RawCSB() {

    const mountPoints = {};//;

    let bar = createBar();
    let blockchain;
    let seed;

    this.getSeed = () => {
        return seed;
    };

    this.mountBarWithSeed = (mountPoint, barMapDigest, callback) => {

    };

    this.mountBarWithDigest = () => {
    };

    this.readFile = (barPath, callback) => {
        bar.readFile(barPath, callback);
    };

    this.writeFile = (srcFilePath, mountPoint, callback) => {

        bar.addFile(srcFilePath, mountPoint, (err, barMapDigest) => {
            if (err) {
                return callback(err);
            }

            getBlockchain((err, bc)=>{
                if (err) {
                    return callback(err);
                }

                if (!seed) {
                    seed = bar.getSeed();
                }

                const transaction = blockchain.startTransactionAs($$.securityContext.getCurrentAgentIdentity(), "StandardCSBTransactions", "addFileAnchor", barMapDigest);
                transaction.onCommit((err => callback(err, barMapDigest)));
            })
        });
    };

    this.readDir = () => {

    };

    /* internal functions */
    function createBlockchain(bar, callback) {
        const worldStateCache = bm.createWorldStateCache("memory");
        const historyStorage = bm.createHistoryStorage("bar", bar);
        const consensusAlgorithm = bm.createConsensusAlgorithm("direct");
        const signatureProvider = bm.createSignatureProvider("permissive");
        bm.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider, true).start(callback);
    }

    function getBlockchain(callback){
        if (!blockchain) {
            createBlockchain(bar, (err, res) => {
                if (err) {
                    return callback(err);
                }

                blockchain = res;
                callback(undefined, blockchain);
            });
        }else{
            callback(undefined, blockchain);
        }
    }

    function createBar() {
        const archiveConfigurator = new barModule.ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        archiveConfigurator.setBufferSize(256);
        archiveConfigurator.setSeedEndpoint("http://localhost:9097");
        return new barModule.Archive(archiveConfigurator);
    }
}

module.exports = RawCSB;