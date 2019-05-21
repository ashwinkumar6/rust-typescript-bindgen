interface ISafeAppBindings {
	createAcc(account_locator: string,account_password: string,invitation: string): session<null>
	login(account_locator: string,account_password: string): session<null>
	authReconnect(auth: *mut Authenticator): session<null>
	authAccountInfo(auth: *mut Authenticator): session<null>
	authExeFileStem(): session<null>
	authSetAdditionalSearchPath(new_path: string): session<null>
	authFree(auth: *mut Authenticator) : session<null>
	authIsMock() : session<types.bool>
}