import aptos from "@/utils/aptos";

class Wallet {

    constructor() {
        if (window.aptos) {
            this.wallet = window.aptos;
        } else if (window.martian) {
            // https://docs.martianwallet.xyz/docs/
            this.wallet = window.martian;
        } else {
            this.wallet = null;
            throw Error("aptos wallet extension not found");
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.wallet.connect().then((response) => {
                console.log('response', response);
                this.address = response.address;
                resolve(response);
            }).catch((err) => {
                console.error(err);
                reject(err);
            });
        });
    }

    async getAccount() {
        if (this.wallet.getAccount) {
            return await this.wallet.getAccount(this.address);
        }
        return await this.wallet.account(this.address);
    }

    async signAndSubmitTransaction(sender, payload) {
        let transaction;
        if (this.wallet.generateTransaction) {
            transaction = await this.wallet.generateTransaction(sender, payload);
        } else {
            transaction = await aptos.client.generateTransaction(sender, payload);
        }
        console.log('transaction', transaction);
        return await this.wallet.signAndSubmitTransaction(transaction);
    }
}

export default Wallet

