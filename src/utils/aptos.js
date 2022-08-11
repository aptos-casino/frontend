import {AptosClient} from "aptos";

class Aptos {
    constructor() {
        this.client = null;
    }

    async updateClient(url) {
        this.client = new AptosClient(url);
    }

    async getBalance(address){
        let resources = await this.client.getAccountResources(address);
        if (!!resources.find){
            let accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
            return accountResource.data.coin.value;
        }
        return -1;
    }
}

export default new Aptos()
