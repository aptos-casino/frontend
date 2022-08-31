<template>
  <section class="game">
    <div class="form">
      <div class="form-group">
        <div>
          <label>BET AMOUNT</label>
          <div class="input-amount-group">
            <div class="input-group">
              <img
                  class="eos-logo"
                  :src="eosLogo"/>
              <input
                  @change="checkBetamount"
                  v-model="eos"/>
            </div>
            <ul class="amount-rate">
              <li @click="setEOS(.5)">1/2</li>
              <li @click="setEOS(2)">2X</li>
              <li @click="setEOS()">MAX</li>
            </ul>
          </div>
        </div>
        <div>
          <label>PAYOUT ON WIN</label>
          <div class="bet-cell">
            <img
                class="eos-logo"
                :src="eosLogo"/>
            <span>{{ payWin }}</span>
          </div>
        </div>
      </div>
      <div class="info-container">
        <ul>
          <li>
            <label>ROLL UNDER TO WIN</label>
            <span>{{ rollUnder }}</span>
          </li>
          <li>
            <label>PAYOUT</label>
            <span>{{ Number(payOut).toFixed(2) }}x</span>
          </li>
          <li>
            <label>WIN CHANCE</label>
            <span>{{ winChance }}%</span>
          </li>
        </ul>
      </div>
      <footer class="game-footer">
        <div class="currenteos-container">
          <img
              class="eos-lg"
              :src="eosLogo"/>
          <span
              :class="{
              'animateUp': this.showUpAnimation,
              'animateDown': this.showDownAnimation
            }"
              class="eos-animation">{{ animationTxt }}</span>
          <span>{{ Number(currentAPTOS).toFixed(4) }}</span>
        </div>
        <el-button
            v-if="account.name"
            @click="doAction"
            class="btn-action">{{ actionTxt }}
        </el-button>
        <button
            v-else
            @click="login"
            class="btn-action">LOGIN
        </button>
        <div class="bet-balance">
          <img
              class="token-logo"
              :src="tokenLogo"/>
          <span>0.0000</span>
        </div>
      </footer>
    </div>

    <dice-slider
        :initial="rollUnder"
        :max="96"
        :min="2"/>

    <el-dialog
        width="30%"
        :visible.sync="showAbout">
      <p slot="title">How To Play</p>
      <ol>
        <li>1. Make sure you have an APTOS account. For more information on how to create one, <a
            href="//medium.com/dapppub/create-your-own-eos-account-easily-using-the-non-service-fee-dapp-signupeoseos-b15c5347f2fc"
            target="_blank">click here</a>.
        </li>
        <li>2. If you haven’t already, download and install <a href="//get-scatter.com/" target="_blank">Scatter</a>, an
          APTOS wallet that facilitates interaction between users and dApps.
        </li>
        <li>3. Set your BET AMOUNT. This is the amount of APTOS you will be wagering.</li>
        <li>4. Adjust the slider to change your chance of winning.</li>
        <li>5. Click ROLL DICE to place your bet.</li>
        <li>6. If your number is lower than your ROLL UNDER TO WIN number, you win!</li>
        <li>7. If you get a notice that your transaction failed, please check that you have enough CPU & bandwidth to
          make the transaction! Please use <a href="//eostoolkit.io/home" target="_blank">EOSToolkit</a> to make any
          changes to your account!
        </li>
      </ol>
      <p>You can view your APTOS balance next to the ROLL DICE button. The table below the slider bar shows recent bets
        from all players across the world.</p>
      <p>Still have questions? Reach out to us at <a
          href="//discordapp.com/channels/482077322070196225/487187255065313292" target="_blank">Discord</a> and we’ll
        be happy to help!</p>
    </el-dialog>

    <el-dialog
        :visible.sync="showSocial">
      <p slot="title">Join the EOSBet Community</p>
      <ul class="social-links">
        <li @click="navigate('twitter')">
          <font-awesome-icon :icon="['fab', 'twitter']"/>
        </li>
        <li @click="navigate('github')">
          <font-awesome-icon :icon="['fab', 'github']"/>
        </li>
        <li @click="navigate('medium')">
          <font-awesome-icon :icon="['fab', 'medium-m']"/>
        </li>
        <li @click="navigate('discord')">
          <font-awesome-icon :icon="['fab', 'discord']"/>
        </li>
      </ul>
    </el-dialog>
  </section>
</template>

<script>
import eosLogo from '@/assets/eos.png';
import tokenLogo from '@/assets/bet-token.png';
import eventHub from '@/utils/event';
import aptos from '@/utils/aptos';
import Wallet from "@/utils/Wallet";
import Contract from "@/utils/contract";
import {keccak256, sha3_256} from "js-sha3";

export default {
  mounted() {
    eventHub.$on('ROLLUNDER_CHANGE', rollUnder => this.rollUnder = rollUnder);
    eventHub.$on('SHOW_ABOUT', () => this.showAbout = true);
    eventHub.$on('SHOW_SOCIAL', () => this.showSocial = true);
    this.getPool();
    this.page_load_time = Number(new Date());
  },

  data() {
    return {
      eosLogo,
      tokenLogo,
      eos: 100,
      rollUnder: 50,
      currentAPTOS: 0,
      poolBalance: 0,
      timer: 0,
      animationTxt: 0,
      actionTxt: 'ROLL DICE',
      showAbout: false,
      showSocial: false,
      animating: false,
      showUpAnimation: false,
      showDownAnimation: false,
      seeds: {},
      gameIdToSeedHash: {},
      ownGame: {}
    };
  },
  methods: {
    //   getAccountBalance() {
    //    let params = {"code":"eosio.token","account":"dicebet"}
    //     let res = await httpRequest.postRequest("http://127.0.0.1:8888/v1/chain/get_currency_balance", params)

    // },

    getPool() {
      if (!!this.$store.state.contract) {
        aptos.getBalance(this.$store.state.contract.address).then(balance => this.poolBalance = balance);
      } else {
        this.poolBalance = 0;
      }
    },

    getPlayerBalance() {
      if (!!this.$store.state.wallet) {
        aptos.getBalance(this.account.name).then(balance => this.currentAPTOS = balance);
      }
    },

    maxBetAmount() {
      return this.poolBalance / (98 / this.winChance);
    },

    setEOS(rate) {
      const {poolBalance, currentEOS} = this;
      let eos = rate ? this.eos * rate : this.currentAPTOS;
      switch (true) {
        case (eos < 0.1):
          eos = 0.1;
          break;
        case (eos > currentEOS):
          eos = currentEOS;
          break;
        case (eos > this.maxBetAmount()):
          eos = this.maxBetAmount();
          break;
      }
      this.eos = Number(eos).toFixed(4);
    },

    prepareClientSeed() {
      let seed = new Uint8Array(64);
      for (let i = 0; i < seed.byteLength; i++) {
        seed[i] = Math.ceil(Math.random() * 1000) % 255;
      }
      const toHexString = (bytes) =>
          bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      const hash = sha3_256(seed);
      this.seeds[hash] = toHexString(seed);
      return {
        seed: toHexString(seed),
        hash
      };
    },

    doAction() {
      let maxAmount = this.maxBetAmount();
      if (this.eos > maxAmount) {
        this.$notify({
          title: 'Bet Failed',
          message: 'Bet Amount should not be more than ' + maxAmount.toFixed(4) + ' APTOS',
          duration: 2000,
          showClose: false,
          type: 'error'
        });
        return;
      }
      const minBetAmount = 100
      if (this.eos < minBetAmount) {
        this.$notify({
          title: 'Bet Failed',
          message: 'Bet Amount should be more than ' + minBetAmount.toFixed(4) + ' APTOS',
          duration: 2000,
          showClose: false,
          type: 'error'
        });
        return;
      }

      const {hash} = this.prepareClientSeed();

      this.$store.state.contract.startRoll(this.account.name, "0x" + hash, this.eos, this.rollUnder)
          .then(() => {
            this.getPlayerBalance();
            this.animating = true;

            this.$notify({
              title: 'Bet success',
              message: 'Waiting for bet result',
              duration: 2000,
              showClose: false,
              type: 'info'
            });
          }).catch(e => {
            console.error(e);
        this.$notify.error((e.message || e.error) || JSON.parse(e).error.details[0].message);
      });
    },

    onStartGame(eventData) {
      const gameId = eventData.data["game_id"];
      const hash = eventData.data["client_seed_hash"].replace("0x", "");
      this.gameIdToSeedHash[gameId] = hash;
      this.ownGame[gameId] = eventData.data["player"] === this.account.name;
    },

    onInitedBackendSeedHashes(eventData) {
      const gameId = eventData.data["game_id"];
      if (!this.ownGame[gameId]) {
          return;
      }
      const handleLater = () => {
        // wait event about finish game
        const gameId = eventData.data["game_id"];
        const hash = this.gameIdToSeedHash[gameId];
        const seed = this.seeds[hash];
        if (!!seed) {
          this.$store.state.contract.SetClientSeed(this.account.name, gameId, seed)
              .catch(console.error);
        }
      }
      setTimeout(handleLater, 5000);
    },

    onInitedBackendSeed(eventData) {
      const gameId = eventData.data["game_id"];
      if (!this.ownGame[gameId]) {
          return;
      }
    },

    onInitedClientSeed(eventData) {
      const gameId = eventData.data["game_id"];
      if (!this.ownGame[gameId]) {
          return;
      }
    },

    onCompletedGameEvent(eventData) {
      this.getPlayerBalance();
      this.getPool();

      const gameId = eventData.data["game_id"];
      this.gameIdToSeedHash[gameId] = null;

      if (!this.ownGame[gameId] || eventData.data["time"] < this.page_load_time * 1000) {
          return;
      }

      const payout = eventData.data["payout"];
      this.animating = false;
      this.$notify({
        title: "Game finished",
        message: payout === "0" ? "Lose" : "Win " + payout,
        duration: 5000,
        showClose: false,
        type: 'info'
      });
    },

    async login() {
      try {
        const wallet = new Wallet();
        if (wallet) {
          await wallet.connect();
          const account = await wallet.getAccount();
          console.log('account', account);
          // todo to target chainid from wallet
          await aptos.updateClient(process.env.VUE_APP_FULL_NODE_URL);
          this.$store.commit('UPDATE_ACCOUNT', {name:wallet.address});
          this.$store.commit('UPDATE_WALLET', wallet);

          const contract = new Contract(process.env.VUE_APP_CONTRACT_ADDRESS, wallet, this);
          this.$store.commit('UPDATE_CONTRACT', contract);
          await this.getPlayerBalance();
          await this.getPool();
          eventHub.$emit('ContractResolved')
          contract.handleEvents();
        }
      } catch (e) {
        this.$message.error(e.message || e);
      }
    },

    checkBetamount() {
    },

    navigate(brand) {
      switch (brand) {
        case 'twitter':
          window.open('//twitter.com/dappPub');
          break;
        case 'medium':
          window.open('//medium.com/dapppub');
          break;
        case 'github':
          window.open('//github.com/dappub');
          break;
        case 'discord':
          window.open('//discordapp.com/channels/482077322070196225/487187255065313292');
          break;
      }
    }
  },

  watch: {
    account() {
    },
    animating() {
      const {animating} = this;
      if (!animating) {
        clearInterval(this.timer);
        this.actionTxt = 'ROLL DICE';
        return;
      }
      this.timer = setInterval(() => {
        this.actionTxt = (Math.random() * 100).toFixed(0);
      }, 100);
    }
  },
  components: {
    diceSlider: require('@/components/slider').default
  },
  computed: {
    winChance() {
      return this.rollUnder - 1;
    },

    payOut() {
      return 98 / this.winChance;
    },

    payWin() {
      return (this.eos * this.payOut).toFixed(4);
    },

    account() {
      return this.$store.state.account;
    }
  }
};
</script>

<style scoped>
.game {
  background: url('../assets/bg.png') top left repeat;
  background-size: contain;
  padding: 60px 0;
}

.form {
  width: 655px;
  border-radius: 5px;
  font-size: 18px;
  background-color: #4b4848;
  margin: 0 auto 20px auto;
  padding: 20px 30px;
}

.form-group {
  display: flex;
  align-items: center;
}

.form-group > div:last-child {
  flex: 1;
}

.amount-rate {
  display: flex;
  align-items: center;
}

.amount-rate li {
  color: #9b9fae;
  font-size: .6em;
  font-weight: 600;
}

.amount-rate li:not(:last-child) {
  border-right: 2px solid #2F2F2F;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  color: #9b9fae;
  font-weight: 600;
  font-size: .6em;
  margin-bottom: .75em;
  display: block;
}

.form-group input {
  text-align: center;
  border: none;
  padding: 10px 12px;
  borde-radius: .3em;
  font-weight: 600;
  letter-spacing: .2px;
  font-size: 18px;
  outline: none;
  background-color: #4b4848;
  width: 177px;
  color: #fff;
}

.input-amount-group {
  display: flex;
  align-items: center;
  background-color: #3f3e3e;
  padding: 2px;
  border-radius: .3em;
  margin-right: 30px;
  height: 47px;
  position: relative;
}

.input-amount-group ul li {
  cursor: pointer;
  padding: 8px 15px;
}

.input-amount-group ul li:hover {
  background-color: #0000003f;
}

.input-group {
  flex: 1;
}

.input-group input {
  padding-left: 15px;
}

.input-group .eos-logo {
  position: absolute;
  left: 10px;
  top: 12.5px;
}

.info-container {
  background-color: #3F3E3E;
  padding: 20px;
}

.info-container ul {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-container ul > li {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.info-container ul > li:not(:last-child) {
  border-right: 2px solid #2F2F2F;
}

.info-container ul > li > label {
  color: #9b9fae;
  font-weight: 600;
  font-size: .6em;
  margin-bottom: .75em;
  display: block;
}

.info-container ul > li > span {
  color: #fff;
  font-size: 1.2em;
  font-weight: 600;
  letter-spacing: .5px;
}

.bet-cell {
  background-color: #3f3e3e;
  border-radius: .3em;
  height: 47px;
  line-height: 47px;
  text-align: center;
  position: relative;
}

.bet-cell > span {
  color: #fff;
  font-weight: 600;
}

.bet-cell .eos-logo {
  position: absolute;
  left: 10px;
  top: 12.5px;
}

.game-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}

.game-footer > div {
  flex: 1;
  text-align: center;
  color: #fff;
  font-weight: 600;
}

.btn-action {
  outline: none;
  letter-spacing: 3px;
  font-weight: 600;
  font-size: 18px;
  background-color: #0191ee;
  border-color: #0191ee;
  cursor: pointer;
  padding: .5rem 1rem;
  line-height: 1.5;
  border-radius: .3rem;
  color: #fff;
  flex: 1;
}

.eos-logo {
  height: 22px;
}

.eos-lg {
  width: 22px;
  margin-right: 5px;
  vertical-align: middle;
}

.token-logo {
  width: 22px;
  vertical-align: middle;
  margin-right: 5px;
}

.game >>> .el-dialog {
  background-color: #4A4848;
}

.game >>> .el-dialog__header {
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
  letter-spacing: .5px;
  color: #fff;
  font-size: 1.25em;
}

.game >>> .el-dialog__body {
  color: #fff;
  padding-top: 0;
  font-weight: 700;
  letter-spacing: .5px;
  color: #fff;
  font-size: 1em;
}

.game >>> .el-dialog__body li,
.game >>> .el-dialog__body p {
  margin-bottom: 10px;
}

.game >>> .el-dialog__body a {
  color: #0191ee;
  text-decoration: none;
}

.game >>> .el-dialog__body a:hover {
  text-decoration: underline;
}

.social-links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px 30px 0 30px;
  font-size: 1.2em;
}

.social-links li {
  border-radius: 50%;
  padding: 10px;
  cursor: pointer;
  transition: background-color ease 200ms;
}

.social-links li:hover {
  background-color: #6C2DED;
}

.bet-balance {
  visibility: hidden;
}

.currenteos-container {
  position: relative;
}

.eos-animation {
  opacity: 0;

  position: absolute;
}

.eos-animation.animateUp {
  animation: fadeOutUp 3s;
  color: #02f292;
  text-shadow: 0 0 5px #02f292;
}

.eos-animation.animateDown {
  animation: fadeOutDown 1s;
  color: #CD4263;
  text-shadow: 0 0 5px #CD4263;
}

@keyframes fadeOutUp {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(0, -100%, 0);
    transform: translate3d(0, -100%, 0);
  }
}

@keyframes fadeOutDown {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
    -webkit-transform: translate3d(0, 100%, 0);
    transform: translate3d(0, 100%, 0);
  }
}
</style>

