require("../../../psknode/bundles/testsRuntime");
const tir = require("../../../psknode/tests/util/tir");

const dc = require("double-check");
const assert = dc.assert;
const constants = require("../moduleConstants").CSB;
let edfs;

const fileName = "testFile";
const fileContent = "lorem ipsum";

function createDossier(callback) {
    edfs.createCSB((err, dossierHandler) => {
        if (err) {
            return callback(err);
        }

        dossierHandler.writeFile(constants.CONSTITUTION_FOLDER + "/" + fileName, fileContent, (err => callback(err, dossierHandler)));
    });
}

assert.callback("Mount - list files - unmount", (finishTest) => {
    dc.createTestFolder("mount", (err, folder) => {
        if (err) {
            throw err;
        }

        tir.launchVirtualMQNode(10, folder, (err, port) => {
            if (err) {
                throw err;
            }


            edfs = require("../index").attachToEndpoint(`http://localhost:${port}`);
            createDossier((err, DossierToMount) => {
                if (err) {
                    throw err;
                }

                createDossier((err, testDossier) => {
                    if (err) {
                        throw err;
                    }

                    testDossier.mount("/", constants.CONSTITUTION_FOLDER, DossierToMount.getSeed(), (err) => {
                        if (err) {
                            throw err;
                        }

                        testDossier.readFile(constants.MANIFEST_FILE, (err, manifestContent) => {
                            assert.isNull(err);
                            const manifest = JSON.parse(manifestContent.toString());
                            assert.true(manifest.mounts.length !== 0);

                            testDossier.listFiles(constants.CONSTITUTION_FOLDER, (err, files) => {
                                assert.isNull(err);
                                assert.true(files.length === 1);
                                assert.true(files[0] === constants.CONSTITUTION_FOLDER + "/" + fileName);

                                testDossier.unmount("/", constants.CONSTITUTION_FOLDER, (err) => {
                                    assert.isNull(err);
                                    testDossier.readFile(constants.MANIFEST_FILE, (err, manifestdata) => {
                                        assert.isNull(err);
                                        const manifest = JSON.parse(manifestdata);
                                        assert.true(manifest.mounts.length === 0);

                                        finishTest();
                                    })
                                });
                            })
                        })
                    });
                })
            });
        });
    });
}, 1500);