import * as fs from "fs";
import * as ref from "ref";
import Utils from "./utils";

const base = require('./refs/base.js');
const types = base.types;

const constants: { [key: string]: string } = {
    callbackMethodInterface: "ICallbackMethod",
    rustReturn: "->"
}

const callbacks: Array<string> = [
    "o_cb",
    "o_disconnect_notifier_cb",
];

const UnwatedParameters: Array<string> = [
    "user_data: types.VoidPtr,",
];

const mapTypes: { [key: string]: string } = {
    "*const App": "types.AppPtr",
    "*const c_char": "string",
    "*const u8": "types.u8Pointer",
    "*mut App": "types.AppPtr",
    "*mut c_void": "types.VoidPtr",
    "usize": "types.usize",
    "u64": "types.u64",
    "bool": "types.bool",
    // "*const MetadataResponse": types,
    // "*const MDataInfo": "MDataInfoPtr",
    // "*const PermissionSet": "PermissionSetPtr",
    // "*const XorNameArray": "XOR_NAME",
    // "*const SymSecretKey": "ASYM_SECRETKEYBYTE",
    // "*const SymNonce": "SYM_NONCEBYTES",
    // "SignPubKeyHandle": "SignPubKeyHandle",
    // "MDataEntriesHandle": "MDataEntriesHandle",
    // "MDataEntryActionsHandle": "MDataEntryActionsHandle",
}

// interface IResultCallback {
//     callback(result: "pointer", ctxt: Function): void
// }

// interface IShortCallback {
//     callback(user_data: "pointer"): void
// }

// interface ILongCallback {
//     callback(user_data: "pointer", result: "pointer", authenticator:, ctxt: Function): void;
// }

class RustParser {
    public rustFuncDefinition = new Array<string>();
    private _jsFuncDefinition = new Array<string>();
    private _jsInterface: string;

    get jsFuncDefinition(): Array<string> {
        this._jsFuncDefinition = this.updateFuncParameters(this.rustFuncDefinition);
        return this._jsFuncDefinition;
    }

    get jsInterface(): string {
        this._jsInterface = this.genInterface(this.rustFuncDefinition);
        return this._jsInterface;
    }

    constructor(filePath: string) {
        var lineArray: Array<string> = fs.readFileSync(filePath).toString().split("\n");
        for (let line = 0; line < lineArray.length; line++) {
            if (lineArray[line].includes("#[no_mangle]")) {
                let wordArray: Array<string> = lineArray[line + 1].split(" ");
                for (let word = 0; word < wordArray.length; word++) {
                    if (wordArray[word].includes("fn")) {
                        this.generateFuncDefinition(wordArray[Number(word) + 1], lineArray, line)
                    }
                }
            }
        }
    }

    private genInterface(jsFuncDefinition: Array<string>): string {
        let resultInterface: string = "interface ISafeAppBindings {";
        let typesArray: Array<string> = Object.keys(mapTypes);

        jsFuncDefinition.forEach((funcDefinition) => {

            // format parameter types
            typesArray.forEach((type) => {
                if (funcDefinition.includes(type)) {
                    funcDefinition = funcDefinition.split(type).join(mapTypes[type]);
                }
            })

            // format callback methods
            callbacks.forEach((callbackName) => {
                if (funcDefinition.includes(callbackName)) {
                    let startIndex: number = funcDefinition.indexOf(callbackName);
                    let temp: string = funcDefinition.substring(startIndex);
                    let endIndex: number = temp.indexOf("),") + 2;
                    let callBackFunc: string = funcDefinition.substring(startIndex, startIndex + endIndex);
                    funcDefinition = funcDefinition.replace(callBackFunc, "").trim();
                }
            })

            // remove unwanted items
            UnwatedParameters.forEach((type) => {
                funcDefinition = funcDefinition.replace(type, "");
            });
            if (funcDefinition[funcDefinition.length - 2] === ",") {
                funcDefinition = Utils.setCharAt(funcDefinition, funcDefinition.length - 2, "");
            }


            // format return type
            if (funcDefinition.includes(constants.rustReturn)) {
                let startIndex: number = funcDefinition.indexOf(constants.rustReturn);
                let returnItem: string = funcDefinition.substring(startIndex);
                funcDefinition = funcDefinition.replace(returnItem, "");
                funcDefinition += ": session<" + returnItem.substring(2).trim() + ">";
            }
            else {
                funcDefinition += ": session<null>";
            }

            // format function name
            let functionName: string = funcDefinition.substring(0, funcDefinition.indexOf("(") - 1);
            let formattedFunctionName = Utils.formatFuncName(functionName);
            funcDefinition = funcDefinition.replace(functionName, formattedFunctionName);

            resultInterface += "\n" + "\t";
            resultInterface += funcDefinition;
        })
        resultInterface += "\n}";
        return resultInterface;
    }

    private generateFuncDefinition(word: string, lineArray: Array<string>, line: number): void {
        let tempResult: string = word.trim();
        line++;
        while (true) {
            line++;
            tempResult += lineArray[line].trim().replace("{", "");
            if (lineArray[line].includes("{"))
                break;
        }
        this.rustFuncDefinition.push(tempResult);
    }

    private updateFuncParameters(rustFuncDefinition: Array<string>): Array<string> {
        var typesArray: Array<string> = Object.keys(mapTypes);
        rustFuncDefinition.forEach((funcDefinition, definitionIndex) => {
            typesArray.forEach((type) => {
                if (funcDefinition.includes(type)) {
                    funcDefinition = funcDefinition.split(type).join(mapTypes[type]);
                }
            })
            if (funcDefinition.includes(constants.rustCallbackMethod)) {
                var index: number = funcDefinition.indexOf(constants.rustCallbackMethod);
                var callBackFunc: string = funcDefinition.substring(index + constants.rustCallbackMethod.length, funcDefinition.length - 2);
                funcDefinition = funcDefinition.replace(callBackFunc, constants.callbackMethodInterface);
            }
            rustFuncDefinition[definitionIndex] = funcDefinition;
            return rustFuncDefinition;
        })
        return rustFuncDefinition;
    }
}

let rustParser = new RustParser("assets/mod(safe_authenticator).rs");
// console.log(rustParser.rustFuncDefinition);
// console.log("\n\n");
// console.log(rustParser.jsInterface);

Utils.fileWriter("ISafeAppBindings.ts",rustParser.jsInterface);




// console.log(rustParser.rustFuncDefinition);
// console.log("\n\n");
// console.log(rustParser.JsFuncDefinition);

// const ffi = require("ffi");
// const libPath = "assets/safe_app.dll";

// interface IAppBindings {
//     app_is_mock(): Boolean
// }

// class AppBindings implements IAppBindings {

//     private native = ffi.Library(libPath, {
//         "app_is_mock": [types.bool,[]],
//     });
//     app_is_mock(): Boolean {
//         return this.native.app_is_mock();
//     }
// }

// var appBindings = new AppBindings();
// console.log("Is Mock?", appBindings.app_is_mock());
