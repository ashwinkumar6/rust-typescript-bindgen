const constants: { [key: string]: string } = {
    callbackMethodInterface: "ICallbackMethod",
    rustReturn: "->",
    rustNoMangle: "#[no_mangle]",
    struct: "struct",

    // Auto generated code
    jsStructHead:
        `import * as ref from 'ref';
        import * as StructType from 'ref-struct';
        import * as types from "./refs/types";`,
    jsInterfaceHead:
        `import * as types from "../refs/types";\n
        export default interface ISafeAppBindings {`,
    jsBindingHead:
        `import ISafeAppBindings from "./ISafeAppBindings"
        import * as types from "../refs/types";\n
        const ffi = require("ffi");
        const libPath = "assets/safe_app.dll";\n
        export default class AppBindings implements ISafeAppBindings {`,
}
export default constants;
