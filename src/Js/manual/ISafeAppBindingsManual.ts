export default interface ISafeAppBindingsManual {
	createAcc(account_locator: string, account_password: string, invitation: string): Promise<void>
	login(account_locator: string, account_password: string): Promise<void>
}
