
function HTTPBrickTransportStrategy(initialConfig) {
    require("psk-http-client");
    const url = initialConfig;

    this.send = (name, data, callback) => {
        $$.remote.doHttpPost(url + "/EDFS/alias/" + name, data, callback);
    };

    this.get = (name, callback) => {
        $$.remote.doHttpGet(url + "/EDFS/alias/" + name, callback);
    };

    this.getHashForAlias = (alias, callback) => {

    };

    this.getLocator = () => {
        return url;
    };
}

module.exports = HTTPBrickTransportStrategy;