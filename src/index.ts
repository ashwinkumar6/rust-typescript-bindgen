import * as fs from "fs";

const rustCallbackMethod:string = "o_cb:";
const types: { [key: string]: string } = {
    "*const App": "AppPtr",
    "*const c_char": "string",
    "*const u8": "u8Pointer",
    "*const MetadataResponse": "UserMetadataPtr",
    "*const MDataInfo": "MDataInfoPtr",
    "*const PermissionSet": "PermissionSetPtr",
    "*const XorNameArray": "XOR_NAME",
    "*const SymSecretKey": "ASYM_SECRETKEYBYTE",
    "*const SymNonce": "SYM_NONCEBYTES",
    "SignPubKeyHandle": "SignPubKeyHandle",
    "MDataEntriesHandle": "MDataEntriesHandle",
    "MDataEntryActionsHandle": "MDataEntryActionsHandle",
    "usize": "usize",
    "u64": "u64",
    "bool": "bool",
    "*mut c_void": "pointer"
}


interface ICallBack {    
}

class RustParser {
    public rustFuncDefinition = new Array<Array<string>>();
    private _jsFuncDefinition = new Array<Array<string>>();

    get JsFuncDefinition(): Array<Array<string>> {
        this._jsFuncDefinition = this.updateFuncParameters(this.rustFuncDefinition);
        return this._jsFuncDefinition;
    }

    constructor(filePath: string) {
        var lineArray: Array<string> = fs.readFileSync(filePath).toString().split("\n");
        for (let line in lineArray) {
            if (lineArray[line].includes("#[no_mangle]")) {
                let wordArray: Array<string> = lineArray[Number(line) + 1].split(" ");
                for (let word in wordArray) {
                    if (wordArray[word].includes("fn")) {
                        this.generateFuncDefinition(wordArray[Number(word) + 1], lineArray, Number(line))
                    }
                }
            }
        }
    }

    private generateFuncDefinition(word: string, lineArray: Array<string>, line: number): void {
        var tempResult: Array<string> = [word];
        line++;
        while (true) {
            line++;
            tempResult.push(lineArray[line].trim().replace("{", ""));
            if (lineArray[line].includes(") {"))
                break;
        }
        this.rustFuncDefinition.push(tempResult);
    }

    private updateFuncParameters(rustFuncDefinition: Array<Array<string>>): Array<Array<string>> {
        var typesArray: Array<string> = Object.keys(types);
        rustFuncDefinition.forEach((funcDefinition, definitionIndex) => {
            funcDefinition.forEach((parameter, definitionItem) => {
                typesArray.forEach((type) => {
                    if (parameter.includes(type)) {
                        parameter = parameter.replace(type, types[type]);
                        rustFuncDefinition[definitionIndex][definitionItem] = parameter
                    }
                    else if (parameter.includes(rustCallbackMethod)) {
                        console.log("substring " + parameter.substring(5));
                    }
                })
            })
        })
        return rustFuncDefinition;
    }
}

var rustParser = new RustParser("assets/access_container.rs");
// console.log(rustParser.rustFuncDefinition);
//console.log(rustParser.JsFuncDefinition);
