function DirectCommunicationStrategy() {
    require("psk-http-client");

    this.send = (url, data, callback) => {
        $$.remote.doHttpPost(url, data, callback);
    };

    this.receive = (url, callback) => {
        $$.remote.doHttpGet(url, callback);
    };
}

module.exports = DirectCommunicationStrategy;