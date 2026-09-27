const fs = require('fs');
const path = require('path');

class HybridFileManager {

    constructor(baseDir = './hybrid-data') {
        this.baseDir = baseDir;

        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, {
                recursive: true
            });
        }
    }

    // Callback-стиль
    createFile(filename, content, callback) {

        const filePath =
            path.join(this.baseDir, filename);

        fs.writeFile(
            filePath,
            content,
            'utf8',
            (err) => {

                if (err) {
                    callback(err);
                    return;
                }

                callback(null, filePath);
            }
        );
    }

    // Promise-стиль
    createFileAsync(filename, content) {

        return new Promise(
            (resolve, reject) => {

                this.createFile(
                    filename,
                    content,
                    (err, filePath) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(filePath);
                    }
                );
            }
        );
    }

    // Callback-стиль чтения
    readFile(filename, callback) {

        const filePath =
            path.join(this.baseDir, filename);

        fs.readFile(
            filePath,
            'utf8',
            (err, data) => {

                if (err) {
                    callback(err);
                    return;
                }

                callback(null, data);
            }
        );
    }

    // Promise-стиль чтения
    readFileAsync(filename) {

        return new Promise(
            (resolve, reject) => {

                this.readFile(
                    filename,
                    (err, data) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(data);
                    }
                );
            }
        );
    }

    deleteFile(filename, callback) {

        const filePath =
            path.join(this.baseDir, filename);

        fs.unlink(
            filePath,
            (err) => {

                if (err) {
                    callback(err);
                    return;
                }

                callback(null);
            }
        );
    }

    deleteFileAsync(filename) {

        return new Promise(
            (resolve, reject) => {

                this.deleteFile(
                    filename,
                    (err) => {

                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve();
                    }
                );
            }
        );
    }
}

module.exports = HybridFileManager;