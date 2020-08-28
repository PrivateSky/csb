const pskcrypto = "pskcrypto";
const crypto = require(pskcrypto);
const storageLocation = "seedCage";
const algorithm = "aes-256-cfb";

/**
 * local storage can't handle properly binary data
 *  https://stackoverflow.com/questions/52419694/how-to-store-uint8array-in-the-browser-with-localstorage-using-javascript
 * @param pin
 * @param callback
 * @returns {*}
 */
function getSeed(pin, callback) {
    let encryptedSeed;
    let seed;
    try {
        encryptedSeed = localStorage.getItem(storageLocation);
        if (encryptedSeed === null || typeof encryptedSeed !== "string" || encryptedSeed.length === 0) {
            return callback(new Error("SeedCage is empty or data was altered"));
        }

        const retrievedEncryptedArr = JSON.parse(encryptedSeed);
        encryptedSeed = new Uint8Array(retrievedEncryptedArr);
        const pskEncryption = crypto.createPskEncryption(algorithm);
        const encKey = crypto.deriveKey(algorithm, pin);
        seed = pskEncryption.decrypt(encryptedSeed, encKey).toString();
    } catch (e) {
        return callback(e);
    }
    callback(undefined, seed);
}

function putSeed(seed, pin, overwrite = false, callback) {
    let encSeed;

    if (typeof overwrite === "function") {
        callback(Error("TODO: api signature updated!"));
    }
    try {
        if (typeof seed === "string") {
            seed = Buffer.from(seed);
        }
        if (typeof seed === "object" && !Buffer.isBuffer(seed)) {
            seed = Buffer.from(seed);
        }

        const pskEncryption = crypto.createPskEncryption(algorithm);
        const encKey = crypto.deriveKey(algorithm, pin);
        encSeed = pskEncryption.encrypt(seed, encKey);
        const encryptedArray =  Array.from(encSeed);
        const encryptedSeed = JSON.stringify(encryptedArray);

        localStorage.setItem(storageLocation, encryptedSeed);
    } catch (e) {
        return callback(e);
    }
    callback(undefined);
}

function check(callback) {
    let item;
    try {
        item = localStorage.getItem(storageLocation);
    } catch (e) {
        return callback(e);
    }
    if (item) {
        return callback();
    }
    callback(new Error("SeedCage does not exists"));
}

module.exports = {
    check,
    putSeed,
    getSeed
};
