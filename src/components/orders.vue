<template>
  <section class="orders-container">
    <header class="orders-tab">
      <ul>
        <li>ALL BETS</li>
      </ul>
    </header>
    <table class="orders-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Bettor</th>
          <th>Roll Under</th>
          <th>Bet</th>
          <th>Roll</th>
          <th>Payout</th>
        </tr>
      </thead>
      <tbody>
        <tr 
          :key="index"
          v-for="(order, index) in orders">
          <td>{{dateFormat(Math.ceil(order.block_time / 1000))}}</td>
          <td :class="[(order.player === player) ? 'player' : '']" >{{order.player}}</td>
          <td>{{order.roll_under}}</td>
          <td>{{order.amount}}</td>
          <td>{{order.random_roll}}</td>
          <td class="payout">
            {{order.payout > 0 && order.payout || ''}}
          </td> 
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script>
  import eventHub from "@/utils/event";
  import {reverse, sortedIndexBy} from "lodash";

  export default {
    mounted() {
      eventHub.$on('ContractResolved', () => {
        this.$store.state.contract.gameCompleateHandler = this.onCompletedGameEvent;
        this.player = this.$store.state.account.name;
      })
    },

    data() {
      return {
        orders: [],
        player: "",
      };
    },

    methods: {
      onCompletedGameEvent(eventData) {
        this.orders.push({
          block_time: eventData.data["time"],
          player: eventData.data["player_addr"],
          roll_under: eventData.data["prediction"],
          amount: eventData.data["bet_amount"],
          random_roll: eventData.data["lucky_number"],
          payout: eventData.data["payout"],
        });
        sortedIndexBy(this.orders, "block_time");
        reverse(this.orders);
      },

      dateFormat(raw) {
        return (new Date(raw).toLocaleDateString() + " " + new Date(raw).toLocaleTimeString());
      }
    }
  };
</script>

<style scoped>
  .orders-container {
    background-color: #191919;
    padding: 20px;
  }   

  .orders-tab {
    color: #fff;
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }

  .orders-tab ul {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #bbb;
  }

  .orders-tab ul li {
    cursor: pointer;
    padding: 7px 35px;
    display: inline-block;
    text-align: center;
    color: #bbb; 
    letter-spacing: .5px;
    font-weight: 600;
  } 

  .orders-table {
    width: 90%;
    color: #fff;
    font-weight: 900;
    letter-spacing: .5px;
    border-collapse: collapse;
    margin: 0 auto;
  }

  .orders-table tbody tr {
    border-radius: 5px;
  }

  .orders-table tbody tr:nth-child(even) {
    background-color: #292929;
  }

  .orders-table td {
    font-size: 16px;
    padding: 20px 0;
    text-align: center;
  }

  .payout {
    color: #02f292;
    text-shadow: 0 0 5px #02f292;
  }
  .player {
    color: #f29202;
  }
</style>

