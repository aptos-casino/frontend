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
            console.log("loop");

            const lastEvent = await aptos.getEvent(this.address, this.address, eventHandleStruct, field, from, 1)
                .catch(() => {
                    return null;
                });
            if (lastEvent) {
                callback(lastEvent);
            }
            console.log("lastEvent", lastEvent);

            //setTimeout(loop, 100);
        };

        setTimeout(loop, 100);
    }

    gameCreated(eventData) {
        console.log("eventData", eventData);
    }

    handleEvents() {
        console.log("handleEvents");
        this.subscribeOnEvents(this.address, "Casino::EventsStore",
            "start_game_event", false, this.gameCreated)
            .catch(console.error);
    }
}

export default Contract
