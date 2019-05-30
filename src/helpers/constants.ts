const constants: { [key: string]: string } = {
    // File paths
    jsInterfacePath: "./src/Js/ISafeAppBindings.ts",
    jsBindingPath: "./src/Js/SafeAppBindings.ts",
    jsStructPath: "./src/Js/Structs.ts",
    jsManualInterfacePath: "./src/Js/manual/ISafeAppBindingsManual.ts",
    jsManualBindingPath: "./src/Js/manual/SafeAppBindingsManual.ts",

    // Auto generated code
    jsStructHead:
        `import * as ref from 'ref';\n` +
        `import * as StructType from 'ref-struct';\n` +
        `import * as types from "../refs/types";`,
    jsInterfaceHead:
        `export default interface ISafeAppBindings {`,
    jsBindingHead:
        `import ISafeAppBindings from "./ISafeAppBindings";\n` +
        `import * as types from "../refs/types";\n\n` +
        `const ffi = require("ffi");\n` +
        `const libPath = "sample_data/safe_app.dll";\n\n` +
        `export default class AppBindings implements ISafeAppBindings {`,

    // Other
    callbackMethodInterface: "ICallbackMethod",
    rustReturn: "->",
    rustNoMangle: "#[no_mangle]",
    struct: "struct",

}
export default constants;
