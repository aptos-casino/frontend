import aptos from "@/utils/aptos";

class Contract {
    constructor(address, wallet) {
        this.address = address;
        this.wallet = wallet;
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

    onStartGame(eventData) {
        console.log("onStartGame", eventData);
    }

    onInitedBackendSeedHashes(eventData) {
        console.log("onInitedBackendSeedHashes", eventData);
    }

    onInitedClientSeedHashes(eventData) {
        console.log("onInitedClientSeedHashes", eventData);
    }

    onInitedBackendSeed(eventData) {
        console.log("onInitedBackendSeed", eventData);
    }

    onInitedClientSeed(eventData) {
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
}

export default Contract
