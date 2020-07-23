'use strict';

const EDFSBrickStorage = require('edfs-brick-storage');

function EDFS(options) {
    options = options || {};

    this.endpoint = options.endpoint;

    if (!this.endpoint) {
        throw new Error('EDFS endpoint is required');
    }

    this.edfsDriver = EDFSBrickStorage.create(this.endpoint);


    this.getBrick = (domain, hash, callback) => {
        this.edfsDriver.getBrick(hash, (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, result);
        });
    }

    this.getMultipleBricks = (domain, hashes, callback) => {
        this.edfsDriver.getMultipleBricks(hashes, (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, result);
        })
    }

    this.putBrick = (domain, brick, callback) => {
        this.edfsDriver.putBrick(brick, (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, result);
        });
    }

    this.updateAlias = (alias, value, lastValue, callback) => {
        this.edfsDriver.attachHashToAlias(alias, value, lastValue, (err) => {
            if (err) {
                return callback(err);
            }

            return callback();
        });
    }

    this.getAliasVersions = (alias, callback) => {
        this.edfsDriver.getHashForAlias(alias, (err, result) => {
            if (err) {
                return callback(err);
            }

            return callback(undefined, result);
        });
    }
}

module.exports = EDFS;
