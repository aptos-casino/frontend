import aptos from "@/utils/aptos";

class Wallet {

    constructor() {
        if (window.pontem) {
            this.wallet = window.pontem;
        } else {
            this.wallet = null;
            throw Error("aptos wallet extension not found");
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.wallet.connect().then((response) => {
                console.log('response', response);
                this.address = response;
                resolve(response);
            }).catch((err) => {
                console.error(err);
                reject(err);
            });
        });
    }

    async getAccount() {
        return await this.wallet.account();
    }

    async signAndSubmitTransaction(sender, payload) {
        const options = {
            max_gas_amount: "10000",
            gas_unit_price: "2",
            expiration_timestamp_secs: new Date().getTime().toString(),
        };
        return await this.wallet.signAndSubmit(payload, options).then(res => {
            return res.result.hash;
        });
    }
}

export default Wallet

