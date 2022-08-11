import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    account: {},
    wallet: null,
    contract: null
  },

  mutations: {
    UPDATE_ACCOUNT(state, account) {
      state.account = account;
    },
    UPDATE_WALLET(state, wallet) {
      state.wallet = wallet;
    },
    UPDATE_CONTRACT(state, contract) {
      state.contract = contract;
    }
  }
});

