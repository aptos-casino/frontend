<template>
  <header class="header">
    <div>
      <img 
      class="dice-logo"
      :src="diceLogo" />
      <a 
        @click="showSocial"
        href="JavaScript:;">COMMUNITIY</a>
    </div>
    <nav>
      <ul>
        <li>
          <a 
            @click="showAbout"
            href="JavaScript:;">HOW TO PLAY</a>
        </li>
        <li>
          <div 
            class="account-cell"
            href="JavaScript:;">
            <span>{{account.name}}</span>
          </div>
        </li>
      </ul>
    </nav> 
  </header>
</template>

<script>
import eventHub from '@/utils/event';
import diceLogo from '@/assets/dice.svg';

export default {
  methods: {
    showAbout() {
      eventHub.$emit('SHOW_ABOUT'); 
    },

    showSocial() {
      eventHub.$emit('SHOW_SOCIAL'); 
    }
  },

  data() {
    return {
      diceLogo
    };
  },

  computed: {
    account() {
      return this.$store.state.account;
    }
  }
};
</script>

<style scoped>
  .header {
    background-color: #3F3E3E; 
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    height: 76px;
    justify-content: space-between;
    padding: 0 30px;
  }  

  .header ul {
    display: flex;
    align-items: center;
  }

  .header ul li {
    margin-left: 30px;
  }

  .header a {
    color: #fff;
    text-decoration: none;
    letter-spacing: .5px;
    font-weight: 600;
    font-size: .9em;
  }

  .header .account-cell {
    color: #fff;
  }

  .header .account-cell > span {
    margin-right: 10px;
  }

  .header a:hover {
    text-shadow: 0 0 5px #fff;
  }

  .icon-logout {
    cursor: pointer;
  }

  .dice-logo {
    width: 40px;
    vertical-align: middle;
    margin-right: 30px;
  }
</style>

