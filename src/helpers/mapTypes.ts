const mapTypes: { [key: string]: string } = {
    "*const App": "types.AppPtr",
    "*const c_char": "types.CString",
    "*const u8": "types.u8Pointer",
    "*mut App": "types.AppPtr",
    "*mut c_void": "types.voidPointer",
    "*mut Authenticator": "types.voidPointer",
    "usize": "types.usize",
    "u64": "types.u64",
    "bool": "types.bool",
    "XorNameArray": "types.XorName",

    "*const ContainerPermissions": "ref.refType( ContainerPermissions )",
    "*const ShareMData": "ref.refType( ShareMData )"
}
export default mapTypes;
