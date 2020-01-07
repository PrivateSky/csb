function EDFS(communicationStrategy) {
    const RawCSB = require("./RawCSB");
    const barModule = require("bar");
    this.createCSB = (callback) => {
        const rawCSB = new RawCSB();
        callback(undefined, rawCSB);
    };

    this.createBar = () => {
        const ArchiveConfigurator = barModule.ArchiveConfigurator;
        ArchiveConfigurator.prototype.registerFsAdapter("FsAdapter", barModule.createFsAdapter);
        ArchiveConfigurator.prototype.registerStorageProvider("EDFSBrickStorage", require("edfs-brick-storage").createEDFSBrickStorage);
        const archiveConfigurator = new ArchiveConfigurator();
        const endpoint = "http://localhost:9096";
        archiveConfigurator.setFsAdapter("FsAdapter");
        archiveConfigurator.setStorageProvider("EDFSBrickStorage", endpoint, communicationStrategy);
        archiveConfigurator.setSeedEndpoint(endpoint);
        archiveConfigurator.setEncryptionAlgorithm("aes-256-gcm");

        return barModule.createArchive(archiveConfigurator);
    };

    this.loadCSB = (seed, callback) => {

    };

    this.loadBar = (seed, callback) => {

    };
}

module.exports = {
    createEDFS(){
        return new EDFS();
    }
};