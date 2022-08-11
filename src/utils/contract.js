import { bcs } from '@mysten/bcs';

class Contract {
    constructor(address, wallet) {
        this.address = address;
        this.wallet = wallet;
    }

    async startRoll(playerAddress, hashSeed, bet, rollUnder){
        const payload = {
            type: "script_function_payload",
            function: `${this.address}::Casino::start_roll`,
            type_arguments: [],
            arguments: [bet.toString(), hashSeed.toString("hex"), rollUnder]
        };
        await this.wallet.signAndSubmitTransaction(playerAddress, payload).then(console.log);
    }

    async SetClientSeed(gameId, seed){

    }

    async SetClientSeedHash(gameId, seedHash){

    }
}

export default Contract
