require("../../../psknode/bundles/testsRuntime");
const tir = require("../../../psknode/tests/util/tir");

const dc = require("double-check");
const assert = dc.assert;
const constants = require("../moduleConstants").CSB;
let edfs;

function createDossier(fileName, fileContent, callback) {
    const dossierHandler = edfs.createRawDossier();
    dossierHandler.writeFile("/"+constants.CODE_FOLDER+"/" +constants.CONSTITUTION_FOLDER + "/" + fileName, fileContent, (err => callback(err, dossierHandler)));
}

assert.callback("readDir test", (finishTest) => {
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

                    testDossier.mount("/dir1", "dir2", DossierToMount.getSeed(), (err) => {
                        if (err) {
                            throw err;
                        }

                        testDossier.addFolder("../brickTransportStrategies", "/folder", (err) => {
                            if (err) {
                                throw err;
                            }

                            testDossier.readDir("/", {withFileTypes: true}, (err, folderObj) => {
                                if (err) {
                                    throw err;
                                }

                                let names = [];
                                Object.values(folderObj).forEach(entryList => {
                                    names = names.concat(entryList)
                                });

                                assert.arraysMatch(names.sort(), ['code', 'dir1', 'folder', 'manifest']);
                                finishTest();
                            });
                        });
                    });
                })
            });
        });
    });
}, 3000);