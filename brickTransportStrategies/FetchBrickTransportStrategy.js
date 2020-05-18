function FetchBrickTransportStrategy(initialConfig) {
    const url = initialConfig;
    this.send = (name, data, callback) => {

        fetch(url + "/EDFS/" + name, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: data
        }).then(function (response) {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().catch((err) => {
                // This happens when the response is empty
                return {};
            });
        }).then(function (data) {
            callback(null, data)
        }).catch(error => {
            callback(error);
        });

    };

    this.get = (name, callback) => {
        fetch(url + "/EDFS/" + name, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.arrayBuffer();
        }).then(arrayBuffer => {
            let buffer = new Buffer(arrayBuffer.byteLength);
            let view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < buffer.length; ++i) {
                buffer[i] = view[i];
            }

            callback(null, buffer);
        }).catch(error => {
            callback(error);
        });
    };

    this.getHashForAlias = (alias, callback) => {
        fetch(url + "/anchoring/getVersions/" + alias, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().then(data => {
                callback(null, data);
            }).catch(error => {
                callback(error);
            })
        });
    };

    this.attachHashToAlias = (alias, name, callback) => {
        fetch(url + '/anchoring/attachHashToAlias/' + name, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/octet-stream'
            },
            body: alias
        }).then(response => {
            if (response.status >= 400) {
                throw new Error(`An error occurred ${response.statusText}`);
            }
            return response.json().catch((err) => {
                // This happens when the response is empty
                return {};
            });
        }).then(data => {
            callback(null, data);
        }).catch(error => {
            callback(error);
        })
    };

    this.getLocator = () => {
        return url;
    };
}

//TODO:why we use this?
FetchBrickTransportStrategy.prototype.FETCH_BRICK_TRANSPORT_STRATEGY = "FETCH_BRICK_TRANSPORT_STRATEGY";
FetchBrickTransportStrategy.prototype.canHandleEndpoint = (endpoint) => {
    return endpoint.indexOf("http:") === 0 || endpoint.indexOf("https:") === 0;
};


module.exports = FetchBrickTransportStrategy;
