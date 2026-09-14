const fs = require('fs');

function readJSONFile(filePath) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
}

function writeJSONFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
    readJSONFile,
    writeJSONFile
};
