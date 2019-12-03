const crypto = require('pskcrypto');
const path = require('path');
const fs = require('fs');

function SeedCage(localFolder) {
    localFolder = localFolder || process.cwd();
    const seedFolder = path.join(localFolder, '.privateSky');
    const seedPath = path.join(seedFolder, 'dseed');
    const algorithm = "aes-256-cfb";

    function loadSeed(pin, callback) {
        fs.readFile(seedPath, (err, encryptedSeed) => {
            if (err) {
                return callback(err);
            }

            const pskEncryption = crypto.createPskEncryption(algorithm);
            const encKey = crypto.deriveKey(algorithm, pin);
            const compactedSeed = pskEncryption.decrypt(encryptedSeed, encKey);

            callback(undefined, compactedSeed);
        });
    }

    function saveSeed(pin, compactedSeed, callback) {
        __ensureFolderExists(seedFolder, (err) => {
            if (err) {
                return callback(err);
            }

            if (typeof compactedSeed === "string") {
                compactedSeed = Buffer.from(compactedSeed);
            }

            if (typeof compactedSeed === "object" && !Buffer.isBuffer(compactedSeed)) {
                try {
					compactedSeed = Buffer.from(compactedSeed);
                } catch (err) {
					return callback(err);
                }
            }

			if (Buffer.isBuffer(compactedSeed)) {
                const pskEncryption = crypto.createPskEncryption(algorithm);
                const encKey = crypto.deriveKey(algorithm, pin);
                const encSeed = pskEncryption.encrypt(compactedSeed, encKey);
                fs.writeFile(seedPath, encSeed, callback);
			}else{
                callback(Error(`compactedSeed should be a string or buffer. Received type ${typeof compactedSeed}`));
            }
        });
    }

    function __ensureFolderExists(folderPath, callback) {
        fs.access(folderPath, (err) => {
            if (err) {
                fs.mkdir(folderPath, {recursive: true}, callback);
            } else {
                callback();
            }
        });
    }

    return {
       loadSeed,
       saveSeed,
    };
}


module.exports = SeedCage;