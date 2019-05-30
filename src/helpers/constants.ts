const constants: { [key: string]: string } = {
    callbackMethodInterface: "ICallbackMethod",
    rustReturn: "->",
    rustNoMangle: "#[no_mangle]",
    struct: "struct",

    // Auto generated code
    jsStructHead:
        `import * as ref from 'ref';\n`+
        `import * as StructType from 'ref-struct';\n`+
        `import * as types from "../refs/types";`,
    jsInterfaceHead:
        `export default interface ISafeAppBindings {`,
    jsBindingHead:
        `import ISafeAppBindings from "./ISafeAppBindings";\n`+
        `import * as types from "../refs/types";\n\n`+
        `const ffi = require("ffi");\n`+
        `const libPath = "assets/safe_app.dll";\n\n`+
        `export default class AppBindings implements ISafeAppBindings {`,
}
export default constants;
