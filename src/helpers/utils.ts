var fs = require("fs");

import mapTypes from "./mapTypes";

class Utils {
    // Convert "ab_cd_ef" to "abCdEf"
    static underscoreToPascalCase(funcName: string): string {
        let temp: string = funcName.split("_").join(" ");
        return temp.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index == 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    // Convert "abCdEf" to "ab_cd_ef"
    static pascalToUnderscoreCase(funcName: string): string {
        return funcName.replace(/(?:^|\.?)([A-Z])/g, function (x, y) {
            return "_" + y.toLowerCase()
        }).replace(/^_/, "")
    }

    // Generate js binding parameters from rust method definition
    static genBindingParameters(funcDef: string) {
        let parameters: string = funcDef.substring(
            funcDef.indexOf("(") + 1,
            funcDef.lastIndexOf(")")
        );

        let startIndex: number = 0;
        let endIndex: number = 0;
        let bindingParam: string[] = [];
        let flag: boolean = true;
        // fetching individual parameters from rust method and mapping with respective js types
        for (let i = 0; i < parameters.length; i++) {
            if (parameters[i] === "(") {
                flag = false;
            }
            else if (parameters[i] === ")") {
                flag = true;
            }

            if (parameters[i] === "," && flag) {
                endIndex = i;
                let temp = parameters.substring(startIndex, endIndex);

                temp = temp.substring(
                    temp.indexOf(":") + 1).trim();

                // map rust types with js types
                if (mapTypes[temp]) {
                    temp = mapTypes[temp];
                }
                else if (temp.includes("fn")) {
                    temp = `"pointer"`;
                }
                else if (temp.includes("user_data")) { // rust call back parameters get converted to 'pointer' in js
                    temp = "types.voidPointer";
                }
                bindingParam.push(temp);
                startIndex = i + 1;
            }
        }
        return bindingParam.toString();
    }

    // Write data to file
    static fileWriter(fileName: string, data: string): void {
        fs.writeFile(fileName, data, (err: string) => {
            if (err) console.log(err);
            console.log("Successfully Written to File.");
        });
    }

    // Set character at particular index
    static setCharAt(str: string, index: number, chr: string): string {
        if (index > str.length - 1) return str;
        return str.substr(0, index) + chr + str.substr(index + 1);
    }
}
export default Utils;
