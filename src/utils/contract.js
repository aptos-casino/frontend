import aptos from "@/utils/aptos";
import {AptosAccount} from "aptos";
import {sha3_256} from "js-sha3";

class Contract {
    constructor(address, wallet) {
        this.address = address;
        this.wallet = wallet;
        this.backendConstructor();
    }

    async startRoll(playerAddress, hashSeed, bet, rollUnder) {
        const payload = {
            type: "script_function_payload",
            function: `${this.address}::Casino::start_roll`,
            type_arguments: [],
            arguments: [bet.toString(), hashSeed.toString("hex"), rollUnder]
        };
        await this.wallet.signAndSubmitTransaction(playerAddress, payload).then(console.log);
    }

    async SetClientSeed(gameId, seed) {

    }

    async getGameState(gameId) {

    }

    async subscribeOnEvents(sender, eventHandleStruct, field, fromLast, callback) {
        let from = 0;
        if (fromLast) {
            const lastEvent = await aptos.getEvent(this.address, this.address, eventHandleStruct, field, 0, 1)
                .catch(() => {
                    return null;
                });
            if (lastEvent) {
                from = lastEvent["sequence_number"];
            }
        }
        const loop = async () => {
            const lastEvent = await aptos.getEvent(this.address, this.address, eventHandleStruct, field, from, 1)
                .catch(() => {
                    return null;
                });
            if (lastEvent) {
                for (let i = 0; i < lastEvent.length; i++) {
                    const event = lastEvent[i];
                    callback(event);
                    if (from === Number(event.sequence_number)) {
                        from += 1;
                    }
                }
                setTimeout(loop, 50);
            } else {
                setTimeout(loop, 1000);
            }
        };

        setTimeout(loop, 100);
    }

    async onStartGame(eventData) {
        console.log("onStartGame", eventData);

        if (eventData.data["player"] !== this.address) {
            return;
        }
        const {hash} = this.prepareBackendSeed();
        await this.SetBackendSeedHash(eventData.data["game_id"], hash);
    }

    async onInitedBackendSeedHashes(eventData) {
        console.log("onInitedBackendSeedHashes", eventData);
    }

    async onInitedClientSeedHashes(eventData) {
        console.log("onInitedClientSeedHashes", eventData);
    }

    async onInitedBackendSeed(eventData) {
        console.log("onInitedBackendSeed", eventData);
    }

    async onInitedClientSeed(eventData) {
        console.log("onInitedClientSeed", eventData);
    }

    handleEvents() {
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "start_game_event", false, this.onStartGame)
            .catch(console.error);
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "inited_backend_seed_hashes_event", false, this.onInitedBackendSeedHashes)
            .catch(console.error);
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "inited_client_seed_hashes_event", false, this.onInitedClientSeedHashes)
            .catch(console.error);
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "inited_backend_seed_event", false, this.onInitedBackendSeed)
            .catch(console.error);

        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "inited_client_seed_event", false, this.onInitedClientSeed)
            .catch(console.error);
    }


    // -------- for backend mock---------
    backendConstructor() {
        this.backendPrivateKey = "f584541815415154554564564556446564548964546654546564346654949456";
        this.backendAccount = new AptosAccount(this.backendPrivateKey);
        this.seeds = {};
    }

    async SetBackendSeed(gameId, seed) {
    }

    async SetBackendSeedHash(gameId, hash) {
        const payload = {
            type: "script_function_payload",
            function: `${this.address}::Casino::set_backend_seed_hash`,
            type_arguments: [],
            arguments: [gameId.toString(), hash.toString("hex")]
        };
        await this.backendSignAndSubmitTransaction(this.backendAccount, payload).then(console.log);
    }

    async backendSignAndSubmitTransaction(account, payload) {
        const transaction = await aptos.client.generateTransaction(account, payload);
        console.log('transaction', transaction);
        return await aptos.client.signAndSubmitTransaction(account, transaction);
    }

    prepareBackendSeed() {
        let seed = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)) + Date.now();
        const s3 = sha3_256.create();
        const hash = s3.hex();
        this.seeds[hash] = seed;
        return {
            seed,
            hash
        };
    }
}

export default Contract
