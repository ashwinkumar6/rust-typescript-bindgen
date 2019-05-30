import * as fs from "fs";
import Utils from "./helpers/utils";
import mapTypes from "./helpers/mapTypes";
import constants from "./helpers/constants";

const callbacks: string[] = [
    "o_cb",
    "o_disconnect_notifier_cb",
];

const excludeParameters: string[] = [
    "user_data: *mut c_void,",
    "auth: *mut Authenticator",
];

const excludeFunctions: string[] = [
    "create_acc",
    "login",
];

const interfaceTypes: { [key: string]: string } = {
    "*const c_char": "string",
    "bool": "boolean",
}

const bindingTypes: { [key: string]: string } = {
    "string": "types.CString",
    "boolean": "types.bool",
    "void": "types.Void",
}

class RustParser {
    public rustFuncDefinition: { [key: string]: string } = {};
    public rustStructDefinition = new Array<string>();
    private _jsInterface: string;
    private _jsStruct: string;
    private _jsBindings: string;

    get jsInterface(): string {
        this._jsInterface = this.genInterface(this.rustFuncDefinition);
        return this._jsInterface;
    }
    get jsStruct(): string {
        this._jsStruct = this.genStruct(this.rustStructDefinition);
        return this._jsStruct;
    }
    get jsBindings(): string {
        this._jsBindings = this.genBindings(this.jsInterface, this.rustFuncDefinition);
        return this._jsBindings;
    }

    constructor(filePath: string) {
        let lineArray: string[] = fs.readFileSync(filePath).toString().split("\n");

        for (let line = 0; line < lineArray.length; line++) {
            // generate function definition
            if (lineArray[line].includes("#[no_mangle]")) {
                let wordArray: string[] = lineArray[line + 1].split(" ");
                for (let word = 0; word < wordArray.length; word++) {
                    if (wordArray[word].includes("fn")) {
                        this.generateFuncDefinition(wordArray[word + 1], lineArray, line)
                    }
                }
            }

            // generate struct definition
            if (lineArray[line].includes("pub struct")) {
                this.generateStructDefinition(lineArray, line)
            }
        }
    }

    private generateFuncDefinition(word: string, lineArray: string[], line: number): void {
        let tempResult: string = word.trim();
        let funcName: string = tempResult.substring(0, tempResult.indexOf("("));
        line++;
        while (true) {
            line++;
            tempResult += lineArray[line].trim().replace("{", "");
            if (lineArray[line].includes("{"))
                break;
        }
        this.rustFuncDefinition[funcName] = tempResult;
    }

    private generateStructDefinition(lineArray: string[], line: number): void {
        let tempResult: string = "";
        for (line; !lineArray[line].includes("}"); line++) {
            if (lineArray[line].includes("///"))
                continue;
            tempResult += lineArray[line].trim();
        }
        tempResult += "}";
        this.rustStructDefinition.push(tempResult);
    }

    private genStruct(rustStructDefinition: string[]): string {
        let resultStructs: string = `${constants.jsStructHead}\n`;
        let typesArray: string[] = Object.keys(mapTypes);

        rustStructDefinition.forEach((structDefinition) => {

            // format parameter types
            typesArray.forEach((type) => {
                if (structDefinition.includes(type)) {
                    structDefinition = structDefinition.split(type).join(mapTypes[type]);
                }
            })

            // generate struct head
            let startIndex: number = structDefinition.indexOf(constants.struct) + constants.struct.length;
            let endIndex: number = structDefinition.indexOf("{");
            let structName: string = structDefinition.substring(startIndex, endIndex).trim();
            let formattedStruct: string = `export const ${structName} = StructType( {`;

            // generate struct body
            let items: string = structDefinition.substring(
                structDefinition.indexOf("{") + 1,
                structDefinition.indexOf("}") - 1
            );
            items.split(",").forEach((item) => {
                if (item.includes("pub"))
                    item = item.replace("pub", "");
                formattedStruct += `\n ${item},`;
            })
            formattedStruct += "\n} );";

            resultStructs += `\n${formattedStruct}`;
            resultStructs += "\n";
        });

        return resultStructs;
    }

    private genInterface(rustFuncDefinitions: { [key: string]: string }): string {
        let resultInterface: string = constants.jsInterfaceHead;
        let typesArray: string[] = Object.keys(interfaceTypes);

        Object.values(rustFuncDefinitions).forEach((funcDefinition) => {

            // format function name
            let functionName: string = funcDefinition.substring(0, funcDefinition.indexOf("("));
            let formattedFunctionName = Utils.underscoreToPascalCase(functionName);
            funcDefinition = funcDefinition.replace(functionName, formattedFunctionName);

            // Don't add manual functions to interface
            if (excludeFunctions.indexOf(functionName) !== -1) {
                return
            }

            // format parameter types
            typesArray.forEach((type) => {
                if (funcDefinition.includes(type)) {
                    funcDefinition = funcDefinition.split(type).join(interfaceTypes[type]);
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
            excludeParameters.forEach((type) => {
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
                funcDefinition += ": Promise<" + returnItem.substring(2).trim() + ">";
            }
            else {
                funcDefinition += ": Promise<void>";
            }

            resultInterface += "\n" + "\t";
            resultInterface += funcDefinition;
        })

        // add manual functions from file ISafeAppBindingsManual.ts
        let manual: string = fs.readFileSync(constants.jsManualInterfacePath).toString();
        manual = manual.substring(manual.indexOf("{") + 1, manual.indexOf("}"));

        resultInterface += manual;
        resultInterface += "}\n";
        return resultInterface;
    }

    private genBindings(jsInterface: string, rustFuncDefinition: { [key: string]: string }): string {
        let resultFile: string = "";
        let binding: string = `\n\tprivate native = ffi.Library(libPath, {`;
        let funcImp: string = "";
        jsInterface = jsInterface.substring(
            jsInterface.indexOf("{") + 1,
            jsInterface.indexOf("}")
        );
        let lineArray: string[] = jsInterface.split("\n");
        for (let i = 0; i < lineArray.length; i++) {
            const item = lineArray[i];
            if (item.includes("Promise")) {

                // generate binding
                let funcName: string = item.substring(0, item.indexOf("(")).trim();
                let returnType: string = item.substring(
                    item.lastIndexOf("<") + 1,
                    item.lastIndexOf(">")
                ).trim();
                returnType = bindingTypes[returnType];
                funcName = Utils.pascalToUnderscoreCase(funcName);
                let rustDefinition = rustFuncDefinition[funcName];
                let parameterTypes = Utils.genBindingParameters(rustDefinition);

                binding += `\n\t\t"${funcName}": [${returnType},[${parameterTypes}]],`;

                // Don't add function implementation for manual functions
                if (excludeFunctions.indexOf(funcName) !== -1) {
                    continue;
                }

                // generate function implementation
                funcImp += `\n\t${item.trim()} {`;
                funcImp += "\n\t\t// todo";
                funcImp += "\n\t\treturn new Promise(resolve => {});";
                funcImp += "\n\t}";
                funcImp += "\n";
            }
        }

        // add manual functions from file ISafeAppBindingsManual.ts
        let manual: string = fs.readFileSync(constants.jsManualBindingPath).toString();
        manual = manual.substring(manual.indexOf("{") + 1, manual.lastIndexOf("}"));

        // generate final result file
        resultFile += constants.jsBindingHead;
        binding += `\n\t});`;
        binding += "\n";
        resultFile += binding
        resultFile += funcImp
        resultFile += manual
        resultFile += "}\n"
        return resultFile;
    }
}

let rustParser = new RustParser("sample_data/mod(safe_authenticator).rs");
Utils.fileWriter(constants.jsInterfacePath, rustParser.jsInterface);
Utils.fileWriter(constants.jsBindingPath, rustParser.jsBindings);

// let rustParser = new RustParser("sample_data/req.rs");
// Utils.fileWriter(constants.jsStructPath, rustParser.jsStruct);
