require("../../../psknode/bundles/testsRuntime");
const tir = require("../../../psknode/tests/util/tir");

const dc = require("double-check");
const assert = dc.assert;
const constants = require("../moduleConstants").CSB;
let edfs;

function createDossier(fileName, fileContent, callback) {
    const dossierHandler = edfs.createCSB();
    dossierHandler.writeFile(constants.CONSTITUTION_FOLDER + "/" + fileName, fileContent, (err => callback(err, dossierHandler)));
}

assert.callback("Test load bar for path", (finishTest) => {
    dc.createTestFolder("mount", (err, folder) => {
        if (err) {
            throw err;
        }

        tir.launchVirtualMQNode(10, folder, (err, port) => {
            if (err) {
                throw err;
            }


            edfs = require("../index").attachToEndpoint(`http://localhost:${port}`);
            createDossier("testFile1", "How about that", (err, DossierToMount) => {
                if (err) {
                    throw err;
                }

                createDossier("testFile2", "Hahaha", (err, testDossier) => {
                    if (err) {
                        throw err;
                    }

                    testDossier.mount(constants.CONSTITUTION_FOLDER, "testFile1", DossierToMount.getSeed(), (err) => {
                        if (err) {
                            throw err;
                        }
                        
                        testDossier.loadBarForPath("constitution/testFile1", (err, dossierContext) => {
                            if (err) {
                                throw err;
                            }

                            dossierContext.rawDossier.listFiles(dossierContext.relativePath, (err, files) => {

                                if (err) {
                                    throw err;
                                }

                                assert.true(files[0] === "/constitution/testFile1");
                                finishTest();

                            });
                        });
                    });
                })
            });
        });
    });
}, 3000);