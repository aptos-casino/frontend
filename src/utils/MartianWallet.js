class MartianWallet {

    constructor() {
        // https://docs.martianwallet.xyz/docs/
        if (!window.martian) {
            throw Error("aptos wallet martian extension not found");
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            window.martian.connect().then((response) => {
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
        return await window.martian.getAccount(this.address);
    }

    async signAndSubmitTransaction(sender, payload) {
        const transaction = await window.martian.generateTransaction(sender, payload);
        console.log('transaction', transaction);
        return await window.martian.signAndSubmitTransaction(transaction);
    }
}

export default MartianWallet

