function HTTPBrickTransportStrategy(endpoint) {
    require("psk-http-client");

    this.send = (name, data, callback) => {
        $$.remote.doHttpPost(endpoint + "/EDFS/" + name, data, (err, brickDigest) => {
            if (err) {
                return callback(err);
            }

            try {
                brickDigest = JSON.parse(brickDigest);
            } catch (e) {
                return callback(e);
            }
            callback(undefined, brickDigest);
        });
    };

    this.get = (name, callback) => {
        $$.remote.doHttpGet(endpoint + "/EDFS/" + name, callback);
    };

    this.getMultipleBricks = (brickHashes, callback) => {
        let query = "?";
        brickHashes.forEach(brickHash => {
            query += "hashes=" + brickHash + "&";
        });
        $$.remote.doHttpGet(endpoint + "/EDFS/downloadMultipleBricks" + query, callback);
    };

    this.getHashForAlias = (alias, callback) => {
        $$.remote.doHttpGet(endpoint + "/anchoring/getVersions/" + alias, (err, hashesList) => {
            if (err) {
                return callback(err)
            }

            callback(undefined, JSON.parse(hashesList.toString()))
        });
    };

    this.attachHashToAlias = (alias, name, callback) => {
        $$.remote.doHttpPost(endpoint + "/anchoring/attachHashToAlias/" + name, alias, callback);
    };

    this.getLocator = () => {
        return endpoint;
    };
}

HTTPBrickTransportStrategy.prototype.canHandleEndpoint = (endpoint) => {
    return endpoint.indexOf("http:") === 0 || endpoint.indexOf("https:") === 0;
};

module.exports = HTTPBrickTransportStrategy;
