function BDNS(){
    const domains = {
    };

    this.addConfig = (domain, config) => {
        domains[domain] = config;
    };

    this.getConfig = (domain) => {
        const config = domains[domain];
        if (typeof config === "undefined") {
            throw Error(`No configuration registered for domain ${domain}. Please provide one.`);
        }
        config.dlDomain = domain;
        config.favouriteEndpoint = config.endpoints[0].endpoint;
        return config;
    };

    this.getDefaultConfig = () => {
        const defaultConfig = this.getConfig('default');
        if (typeof defaultConfig === "undefined") {
            throw Error("There is no default configuration. Please provide one.")
        }

        return defaultConfig;
    };
}

$$.BDNS = new BDNS();