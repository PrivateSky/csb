
function HTTPBrickTransportStrategy(initialConfig) {
    require("psk-http-client");
    const url = initialConfig;

    this.send = (name, data, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/" + name, data, callback);
    };

    this.get = (name, callback) => {
        $$.remote.doHttpGet(url + "/EDFS/" + name, callback);
    };

    this.getHashForAlias = (alias, callback) => {
        $$.remote.doHttpGet(url + "/EDFS/getVersions/" + alias, (err, hashesList) => callback(err, JSON.parse(hashesList.toString())));
    };

    this.attachHashToAlias = (alias, name, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/attachHashToAlias/" + name, alias, callback);
    };

    this.getLocator = () => {
        return url;
    };
}

module.exports = HTTPBrickTransportStrategy;