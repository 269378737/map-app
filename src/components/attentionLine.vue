<template>
  <div class="attentionLine">
    <ul>
      <router-link :to="{name:'linePath',params:{id:data.DeviceID, timeId: data.timeid || -1}}" tag="li" v-for="(data, index) in dataList" :key="index">
        <div class="list_item list_item_img clear_fix">
          <div>
            <img src="../assets/img/icon_car.png" alt="">
          </div>
          <div>{{data.Number}}<span class="status" :class="data.statu == 0 ? 'no-leave' : 'leave'">{{ data.statu == 1 ? '已发车' : '未发车' }}</span></div>
        </div>
        <div class="list_item clear_fix">
          <div>
            <img src="../assets/img/icon_time.png" alt="">
          </div>
          <div class="list_item_spec"> {{data.StartTime}} - {{data.EndTime}}</div>
        </div>
        <div class="list_item clear_fix">
          <div>
            <img src="../assets/img/icon_adr.png" alt="">
          </div>
          <div class="list_item_spec">{{data.StartStation}} - {{data.EndStation}}</div>
        </div>
      </router-link>
    </ul>
    <router-link to="/allLine" tag="div" class="list_btn">查看全部路线</router-link>
  </div>
</template>

<script>
  import {domain, wxUrl } from '@/assets/js/common-const-data'
  export default {
    data () {
      return {
        dataList:[],
        timer: null,
        code: null
      }
    },
    created() {
      this.code = this.getQueryString('code');
      if (!this.code && process.env.NODE_ENV === 'production') {
        window.location.href = wxUrl;
      } else {
        this.getFollows();
        this.timer = setInterval(this.getFollows, 30000);
      }
    },
    methods: {
      getFollows() {
        let url = `${domain}/gps/index.php?m=Home&c=Device&a=getFollow&code=` + this.code
        this.$http.post(url).then((response) => {
          this.dataList = response.data;
        })
      }
    },
    destroyed(){
      clearInterval( this.timer );
    }
  }
</script>

<style>
  .attentionLine ul{
    margin-bottom:4rem;
  }
  .attentionLine .list_btn {
    width:100%;
    position: fixed;
    left: 0;
    bottom: 0;
    font-size: 1.04rem;
    padding:.91rem 0;
    background-color: #a1b0d7;
    color: #ffffff;
  }

</style>
