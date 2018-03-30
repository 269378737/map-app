<template>
  <div class="allLine">
    <ul>
      <router-link :to="{name:'lineDetail',params:{id:data.DeviceID,timeId: data.timeid}}" tag="li" v-for="data in dataList" :key="data.DeviceID">
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
          <div class="list_item_spec" v-if="data.statu == 1 "> {{data.StartTime}}-{{data.EndTime}}</div>
          <div class="list_item_spec" v-else>未发车</div>
        </div>
        <div class="list_item clear_fix">
          <div>
            <img src="../assets/img/icon_adr.png" alt="">
          </div>
          <div class="list_item_spec" v-if="data.statu == 1 ">{{data.StartStation}}—{{data.EndStation}}</div>
          <div class="list_item_spec" v-else>未发车</div>
        </div>
      </router-link>
    </ul>
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
      self.$http.post(domain+'/gps/index.php/device/getDeviceAll').then((response) => {
        self.dataList=response.data;
      })
    }
  }
</script>

<style>
</style>
