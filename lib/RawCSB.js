require('../../../psknode/bundles/pskruntime');
require('../../../psknode/bundles/psknode');
const bm = require("blockchain");
const edfsBrickStorage = require("edfs-brick-storage");
const barModule = require("bar");

function RawCSB(securityContext) {

    const mountPoints = {};//;

    let bar = createBar();
    let blockchain;

    this.mountBarWithSeed = (mountPoint, barMapDigest, callback) => {

    };

    this.mountBarWithLSeed = () => {
    };

    this.mountBarWithDigest = () => {
    };

    this.readFile = (barPath, callback) => {
        bar.readFile(barPath, callback);
    };

    this.writeFile = (srcFilePath, barPath, callback) => {
        bar.addFile(srcFilePath, barPath, (err, digest) => {
            if (err) {
                return callback(err);
            }
            getBlockchain((err, blockchain) => {
                if (err) {
                    return callback(err);
                }

                blockchain.startTransactionAs(securityContext.getCurrentAgentIdentity(), "standardCSBTransaction", "addFileAnchor", barPath, digest);
                callback();
            });
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
        bm.createABlockchain(worldStateCache, historyStorage, consensusAlgorithm, signatureProvider).start(callback);
    }

    function getBlockchain(callback){
        if (!blockchain) {
            createBlockchain(bar, (err, res) => {
                if (err) {
                    return callback(err);
                }

                blockchain = res;
                return callback(undefined, blockchain);
            });
        }

        return callback(undefined, blockchain);
    }

    function createBar() {
        const archiveConfigurator = new barModule.ArchiveConfigurator();
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", securityContext.getEDFSNode());
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");
        return new barModule.Archive(archiveConfigurator);
    }
}

module.exports = RawCSB;