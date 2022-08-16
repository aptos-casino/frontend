import aptos from "@/utils/aptos";
import {AptosAccount, HexString} from "aptos";
import {sha3_256} from "js-sha3";

class Contract {
    constructor(address, wallet) {
        this.address = address;
        this.wallet = wallet;
        this.backendConstructor();
        this.onStartGame = this.onStartGame.bind(this)
        this.onInitedBackendSeedHashes = this.onInitedBackendSeedHashes.bind(this)
        this.onInitedClientSeedHashes = this.onInitedClientSeedHashes.bind(this)
        this.onInitedBackendSeed = this.onInitedBackendSeed.bind(this)
        this.onInitedClientSeed = this.onInitedClientSeed.bind(this)
        this.getGameState = this.getGameState.bind(this)
    }

    async startRoll(playerAddress, hashSeed, bet, rollUnder) {
        console.log("///////////");
        console.log("getGameState", await this.getGameState(324));
        console.log("///////////");
        return
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
        const payload = {
            type: "script_function_payload",
            function: `${this.backendAddress}::Casino::get_game_state`,
            type_arguments: [],
            arguments: [gameId.toString()]
        };
        const account1 = new AptosAccount(undefined, this.address);
        // const account2 = new AptosAccount();
        console.log(">>>>>>>>>>>>>>>>>",account1);
        const transaction = await aptos.client.generateTransaction(account1.address().toString(), payload);
        transaction.signature.signature = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        // const transactionSigned =  await aptos.client.signTransaction(account1, transaction);
        console.log(">>>>>>>>>>>>>>>>>",JSON.stringify(transaction, null, 4));
        return await aptos.client.simulateTransaction(transaction);
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
                // setTimeout(loop, 50);
            } else {
                setTimeout(loop, 1000);
            }
        };

        setTimeout(loop, 100);
    }

    async onStartGame(eventData) {
        console.log("onStartGame", eventData);

        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        const {hash} = this.prepareBackendSeed();
        await this.SetBackendSeedHash(eventData.data["game_id"], hash);
    }

    async onInitedBackendSeedHashes(eventData) {
        console.log("onInitedBackendSeedHashes", eventData);

        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        // const gameState = await this.getGameState(eventData.data["game_id"]);
        // console.log('gameState', gameState);
        // await this.SetClientSeed(eventData.data["game_id"], seed);
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
        // console.log('backendConstructor');
        this.backendPrivateKey = "f584541815415154554564564964488564548964546654546564346654949456";
        this.backendAddress = "0xe3958730e1aefc132d5e940f60ee48aadee6dfb2029bc91267472ca5120c083e";
        this.backendAccount = new AptosAccount(new HexString(this.backendPrivateKey).toUint8Array(), this.backendAddress);
        this.backendSeeds = {};
        // console.log('this.backendAccount', this.backendAccount);
        // console.log('new HexString(this.backendPrivateKey).toUint8Array()', new HexString(this.backendPrivateKey).toUint8Array());
    }

    async SetBackendSeed(gameId, seed) {
        const payload = {
            type: "script_function_payload",
            function: `${this.backendAddress}::Casino::set_backend_seed`,
            type_arguments: [],
            arguments: [gameId.toString(), seed.toString("hex")]
        };
        await this.backendSignAndSubmitTransaction(this.backendAddress, payload)
            .then(console.log);
    }

    async SetBackendSeedHash(gameId, hash) {
        const payload = {
            type: "script_function_payload",
            function: `${this.backendAddress}::Casino::set_backend_seed_hash`,
            type_arguments: [],
            arguments: [gameId.toString(), hash.toString("hex")]
        };
        await this.backendSignAndSubmitTransaction(this.backendAddress, payload)
            .catch(console.error);
    }

    async backendSignAndSubmitTransaction(sender, payload) {
        const transaction = await aptos.client.generateTransaction(sender, payload);
        const transactionSigned =  await aptos.client.signTransaction(this.backendAccount, transaction);
        return await aptos.client.submitTransaction(transactionSigned);
    }

    prepareBackendSeed() {
        let seed = Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)) + Date.now();
        const s3 = sha3_256.create();
        const hash = s3.hex();
        this.backendSeeds[hash] = seed;
        return {
            seed,
            hash
        };
    }
}

export default Contract
