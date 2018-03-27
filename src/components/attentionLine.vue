<template>
  <div class="attentionLine">
    <ul>
      <router-link :to="{name:'lineDetail',params:{id:data.DeviceID}}" tag="li" v-for="data in dataList" :key="data.DeviceID">
        <div class="list_item list_item_img clear_fix">
          <div>
            <img src="../assets/img/icon_car.png" alt="">
          </div>
          <div>{{data.Number}}</div>
        </div>
        <div class="list_item clear_fix">
          <div>
            <img src="../assets/img/icon_time.png" alt="">
          </div>
          <div class="list_item_spec">{{data.StartTime}}-{{data.EndTime}}</div>
        </div>
        <div class="list_item clear_fix">
          <div>
            <img src="../assets/img/icon_adr.png" alt="">
          </div>
          <div class="list_item_spec">{{data.StartStation}}—{{data.EndStation}}</div>
        </div>
      </router-link>
    </ul>
    <router-link to="/allLine" tag="div" class="list_btn">查看全部路线</router-link>
  </div>
</template>

<script>
  import {domain} from '@/assets/js/common-const-data'
  export default {
    data () {
      return {
        dataList:[]
      }
    },
    created:function () {
      var self=this;
      self.$http.post(domain+'/gps/index.php/device/getFollow').then((response) => {
        self.dataList=response.data;
      })
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
