const readline  = require("readline");
const {csvParse} = require('d3-dsv');
const fs = require('fs');


async function valueOfFile(path, format) {
    switch(format) {
        case 'csv':
            return  csvParse(fs.readFileSync(path))
        case 'ndjson':
            let data = [];
            return await new Promise((resolve, reject)=> {
                readline.createInterface({
                    input: fs.createReadStream(path),
                    output: null
                }).on("line", (line)=>{
                    try {
                        data.push(JSON.parse(line));
                    } 
                    catch (error) {
                        reject(error);
                    }
                })
                .on('close', ()=>{
                    resolve(data);
                })
            }).catch(error=>{
                console.error("SyntaxError: " + error.message);
                process.exit(1);
            })
        case 'json':
            return JSON.parse(fs.readFileSync(path))
        case 'string':
            return fs.readFileSync(path);
        default:
            console.error(`Unkown format passed in: ${format}`);
            process.exit(1);
    }
}

function parseArgRedefines(argRedefines){ 
    const redefines = []
    for(const redefine of argRedefines) {
        redefines.push(parseRedefine(redefine));
    }
    return redefines;
}

function parseArgRedefineFiles(argRedefineFiles) {
    const redefineFiles = []
    for(const redefineFile of argRedefineFiles) {
        redefineFiles.push(parseRedefineFile(redefineFile));
    }
    return redefineFiles;
}

function parseRedefine(redefine) {
    const firstSep = redefine.indexOf(':');
    if(firstSep < 0) {
        console.error(`Redefine syntax for "${redefine}" is incorrect. A ':' must be included.`)
        process.exit(1)
    }
    const secondSep = redefine.indexOf(':', firstSep+1);

    const cell = redefine.substring(0, firstSep);
    const value = redefine.substring( secondSep > -1 ? secondSep +1 : firstSep + 1);
    const format = secondSep > -1 ? redefine.substring(firstSep+1, secondSep) : 'string';
    return {cell, value, format};
}

function parseRedefineFile(redefine) {
    const firstSep = redefine.indexOf(':');
    let secondSep, format;
    if(firstSep < 0) {
        console.error(`Redefine syntax for "${redefine}" is incorrect. A ':' must be included.`)
        process.exit(1)
    }
    secondSep = redefine.indexOf(':', firstSep + 1);
    if(secondSep < 0) {
        secondSep = firstSep;
        format = 'string';
    }
    else {
        format = redefine.substring(firstSep+1, secondSep);
    }

    const cell = redefine.substring(0, firstSep);
    const value = redefine.substring(secondSep+1);
    return {cell, value, format};
}

module.exports = {
    parseArgRedefines,
    parseArgRedefineFiles,
    valueOfFile
}