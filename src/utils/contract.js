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

    async subscribeOnEvents(sender, eventHandleStruct, fields, fromLast, callback) {
        let from = 0;
        if (fromLast) {
            const lastEvent = await aptos.getEvent(this.address, this.address, eventHandleStruct, fields[0], 0, 1)
                .catch(() => {
                    return null;
                });
            if (lastEvent) {
                from = lastEvent["sequence_number"];
            }
        }
        const loop = async () => {
            console.log("loop");
            const data = {}
            let exits = false;
            for (let i = 0; i < fields.length; i++) {
                const lastEvent = await aptos.getEvent(this.address, this.wallet.address, eventHandleStruct, fields[i], from, 1)
                    .catch(() => {
                        return null;
                    });
                if (!lastEvent) {
                    exits = false;
                    break;
                }
                console.log("lastEvent", lastEvent);
                data[fields[i]] = lastEvent;
                exits = true;
            }
            if (exits) {
                callback(data);
                from += 1;
            }
            //setTimeout(loop, 100);
        }

        setTimeout(loop, 1000);
    }

    gameCreated(eventData) {
        console.log("eventData", eventData);
    }

    handleEvents() {
        console.log("handleEvents");
        this.subscribeOnEvents(this.address, "Casino::StartedGameEvent",
            ["player", "client_seed_hash", "bet_amount", "game_id"], false, this.gameCreated)
            .catch(console.error);
    }
}

export default Contract
