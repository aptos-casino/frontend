import {AptosClient} from "aptos";
import fetch from "./api";

class Aptos {
    constructor() {
        this.client = null;
    }

    async updateClient(url) {
        this.client = new AptosClient(url);
        this.url = url;
    }

    async getBalance(address) {
        let resources = await this.client.getAccountResources(address);
        if (!!resources.find) {
            let accountResource = resources.find((r) => r.type === "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>");
            return accountResource.data.coin.value;
        }
        return -1;
    }

    async getEvent(address, sender, eventHandleStruct, fieldName, from, limit) {
        console.log('address, sender, eventHandleStruct, fieldName, from, limit', address, sender, eventHandleStruct, fieldName, from, limit)
        let url = this.url + "/accounts/" + (sender || address)
            + "/events/" + address + "::" + eventHandleStruct
            + "/" + fieldName
            + "?start=" + String(from)
            + "&&limit=" + String(limit)
        console.log(url);
        console.log("////////////////////");
        console.log(await fetch("https://raw.githubusercontent.com/aptos-labs/aptos-core/main/Cargo.lock"));
        console.log("////////////////////");
        return fetch(url);
    }
}

export default new Aptos()
