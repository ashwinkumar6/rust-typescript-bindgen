var fs = require("fs");

class Utils {
    // convert "ab_cd_ef" to "abCdEf"
    static formatFuncName(funcName: string): string {
        let temp: string = funcName.split("_").join(" ");
        return temp.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index == 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    // Write data to file
    static fileWriter(fileName: string, data: string): void {
        fs.writeFile(fileName, data, (err) => {
            if (err) console.log(err);
            console.log("Successfully Written to File.");
        });
    }

    // set character at particular index
    static setCharAt(str: string, index: number, chr: string): string {
        if (index > str.length - 1) return str;
        return str.substr(0, index) + chr + str.substr(index + 1);
    }
}
export default Utils;
