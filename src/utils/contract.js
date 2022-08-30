import aptos from "@/utils/aptos";
import {AptosAccount, HexString} from "aptos";
import {sha3_256} from "js-sha3";

class Contract {
    constructor(address, wallet, eventHandler) {
        this.address = address;
        this.wallet = wallet;
        this.eventHandler = eventHandler;
        this.gameCompleateHandler = null;
        this.backendConstructor();
        this.onStartGame = this.onStartGame.bind(this)
        this.onInitedBackendSeedHashes = this.onInitedBackendSeedHashes.bind(this)
        this.onInitedClientSeedHashes = this.onInitedClientSeedHashes.bind(this)
        this.onInitedBackendSeed = this.onInitedBackendSeed.bind(this)
        this.onInitedClientSeed = this.onInitedClientSeed.bind(this)
        this.onCompletedGameEvent = this.onCompletedGameEvent.bind(this)
        this.getGameState = this.getGameState.bind(this)
    }

    async startRoll(playerAddress, hashSeed, bet, rollUnder) {
        const payload = {
            type: "entry_function_payload",
            function: `${this.address}::Casino::start_roll`,
            type_arguments: [],
            arguments: [bet.toString(), hashSeed, rollUnder]
        };
        console.log('payload', payload)
        await this.wallet.signAndSubmitTransaction(playerAddress, payload).then(console.log);
    }

    async SetClientSeed(playerAddress, gameId, seed) {
        const payload = {
            type: "script_function_payload",
            function: `${this.address}::Casino::set_client_seed`,
            type_arguments: [],
            arguments: [gameId.toString(), seed]
        };
        await this.wallet.signAndSubmitTransaction(playerAddress, payload).then(console.log);
    }

    async getGameState(gameId) {
        console.log(await aptos.client.getAccount(this.address));
        const payload = {
            type: "script_function_payload",
            function: `${this.backendAddress}::Casino::get_game_state`,
            type_arguments: [],
            arguments: [gameId.toString()]
        };
        // const account1 = new AptosAccount(undefined, this.address);
        const account1 = this.backendAccount;
        // const account2 = new AptosAccount();
        console.log(">>>>>>>>>>>>>>>>>", account1);
        const transaction = await aptos.client.generateTransaction(account1.address().toString(), payload);
        transaction.signature.signature = "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        // const transactionSigned =  await aptos.client.signTransaction(account1, transaction);
        console.log(">>>>>>>>>>>>>>>>>", JSON.stringify(transaction, null, 4));
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
            const lastEvents = await aptos.getEvent(this.address, this.address, eventHandleStruct, field, from, 25)
                .catch(() => {
                    return null;
                });
            if (lastEvents) {
                for (let i = 0; i < lastEvents.length; i++) {
                    const event = lastEvents[i];
                    callback(event);
                    if (from === Number(event.sequence_number)) {
                        from += 1;
                    }
                }
                setTimeout(loop, 1000/*50*/);
            } else {
                setTimeout(loop, 5000);
            }
        };

        setTimeout(loop, 100);
    }

    async onStartGame(eventData) {
        console.log("onStartGame", eventData);

        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }

        await this.eventHandler.onStartGame(eventData);

        const {hash} = this.prepareBackendSeed();
        const gameId = eventData.data["game_id"];
        this.gameIdToSeedHash[gameId] = hash;
        await this.SetBackendSeedHash(gameId, hash);
    }

    async onInitedBackendSeedHashes(eventData) {
        console.log("onInitedBackendSeedHashes", eventData);

        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        await this.eventHandler.onInitedBackendSeedHashes(eventData);
    }

    async onInitedClientSeedHashes(eventData) {
        console.log("onInitedClientSeedHashes", eventData);

        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        await this.eventHandler.onInitedClientSeedHashes(eventData);
    }

    async onInitedBackendSeed(eventData) {
        console.log("onInitedBackendSeed", eventData);
        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        await this.eventHandler.onInitedBackendSeed(eventData);
    }

    async onInitedClientSeed(eventData) {
        console.log("onInitedClientSeed", eventData);
        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        await this.eventHandler.onInitedClientSeed(eventData);

        const gameId = eventData.data["game_id"];
        const hash = this.gameIdToSeedHash[gameId];
        const seed = this.backendSeeds[hash];
        await this.SetBackendSeed(gameId, seed);
    }

    async onCompletedGameEvent(eventData) {
        console.log("onCompletedGameEvent", eventData);
        // if (eventData.data["player"] !== this.address) {
        //     return;
        // }
        await this.eventHandler.onCompletedGameEvent(eventData);
        if (this.gameCompleateHandler) {
            this.gameCompleateHandler(eventData);
        }
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
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "completed_game_event", false, this.onCompletedGameEvent)
            .catch(console.error);
    }


    // -------- for backend mock---------
    backendConstructor() {
        // console.log('backendConstructor');
        this.backendPrivateKey = "f5845418a541515455456456496448f56454896454665454a56c34a6fb94b45a";
        this.backendAddress = "0xd2d754040e462f42833b6a48ac5aa411ea067afef9106b042723b2cfc5f205a9";
        this.backendAccount = new AptosAccount(new HexString(this.backendPrivateKey).toUint8Array(), this.backendAddress);
        this.backendSeeds = {};
        this.gameIdToSeedHash = {};
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
        const transactionSigned = await aptos.client.signTransaction(this.backendAccount, transaction);
        return await aptos.client.submitTransaction(transactionSigned);
    }

    prepareBackendSeed() {
        let seed = new Uint8Array(64);
        for (let i = 0; i < seed.byteLength; i++) {
            seed[i] = Math.ceil(Math.random() * 1000) % 255;
        }
        const s3 = sha3_256.create();
        console.log(sha3_256.hex(seed));
        sha3_256.update(seed);
        seed = sha3_256.hex(seed);
        const hash = s3.hex().toString("hex");
        this.backendSeeds[hash] = seed;
        return {
            seed,
            hash
        };
    }
}

export default Contract
