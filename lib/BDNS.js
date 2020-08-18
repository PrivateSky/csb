function BDNS(){
    let hosts = {};

    this.addConfig = (domain, config) => {
        hosts[domain] = config;
    };

    this.getConfig = (domain, callback) => {
        const config = hosts[domain];
        if (typeof config === "undefined") {
            return callback(Error(`No configuration registered for domain ${domain}. Please provide one.`));
        }
        config.dlDomain = domain;
        config.favouriteEndpoint = config.endpoints[0].endpoint;
        callback(undefined, config);
    };

    this.getDefaultConfig = (callback) => {
        this.getConfig('default', callback);
    };
}

$$.BDNS = new BDNS();