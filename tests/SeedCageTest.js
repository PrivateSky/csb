require("../../../psknode/bundles/testsRuntime");
require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/edfsBar");
require("../../../psknode/bundles/consoleTools");

const SeedCage = require("../lib/SeedCage");
const double_check = require("../../double-check");
const assert = double_check.assert;

double_check.createTestFolder("cageFolder", (err, testFolder) => {
    if (err) {
        throw err;
    }

    assert.callback("SeedCageTest", (callback) => {
        const seedCage = new SeedCage(testFolder);
        const compactSeed = "testSeed";
        const pin = "12345";

        seedCage.saveSeed(pin, compactSeed, (err) => {
            if (err) {
                throw err;
            }

            seedCage.loadSeed(pin, (err, loadedSeed) => {
                if (err) {
                    throw err;
                }

                assert.equal(compactSeed, loadedSeed, "Loaded seed is not the same as the initial seed.");
                callback();
            });
        });
    });
});