import ISafeAppBindingsManual from "./ISafeAppBindingsManual";

export default class AppBindingsManual implements ISafeAppBindingsManual {
    createAcc(account_locator: string, account_password: string, invitation: string): Promise<void> {
        // todo
		return new Promise(resolve => {});
    }

    login(account_locator: string, account_password: string): Promise<void> {
        // todo
        return new Promise(resolve => {});
    }
}
