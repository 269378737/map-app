<template>
    <div>
        <div class="header">
            <button class="btn-back" @click="toBack"><i class="fa fa-reply"></i> 返回</button>
            {{carInfo.Number}}
            <!-- <button class="btn-attention" @click="toAttention">{{ decState == 0 ? '关注' : '取消关注' }}</button> -->
        </div>
        <div class="stations-s-e">
            <div class="left">{{startStation}}</div>
            <div class="middle"><i class="fa fa-long-arrow-right"></i></div>
            <div class="right">{{endStation}}</div>
        </div>
        <div class="stations-s-e">
            <div class="left">{{carInfo.StartTime}}</div>
            <div class="middle"></div>
            <div class="right">{{carInfo.EndTime}}</div>
        </div>
        <div class="list">
            <ul>
                <li v-for="(item, index) in stationList" :key="index">
                    <span class="station-name">{{item.Name}}</span>
                    
                    <span :class="!item.type ? (parseInt(item.Order) <= parseInt(curStationNum) ? 'station-num-gray' : 'station-num') : 'car-marker'">
                        {{!item.type ? item.Order : ''}}
                        <!-- <i class="fa fa-angle-double-down arrow-double-down-1" v-if="item.type"></i>
                        <i class="fa fa-angle-double-down arrow-double-down-2" v-if="item.type"></i> -->
                        <!-- <i class="fa fa-angle-double-down arrow-double-down-3" v-if="item.type"></i> -->
                    </span>
                    <span class="car-num">{{ item.type ? deviceLocation[0].name : (deviceLocation.length > 0 && deviceLocation[0].statu == 0 && item.Order == 1) ? '未发车' : '' }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {domain, wxUrl} from '@/assets/js/common-const-data'
// import '../mock/mock.js'
export default {
    data() {
        return {
            deviceId: '',
            timeId: '',
            code: null, // 微信接口返回
            stationList: [], //站点列表
            deviceLocation: [], //设备位置信息
            startStation: '', // 起点站
            endStation: '', // 终点站
            decState: 0,
            carInfo: {},
            curStationNum: 0, // 车辆当前站点Order
        }
    },
    created: function () {
        this.deviceId = this.$route.params.id;
        this.timeId = this.$route.params.timeId;

        this.code = this.getQueryString('code');
        if (!this.code && process.env.NODE_ENV === 'production') {
            window.location.href = wxUrl;
        }


        Promise.all([
            this.getStation(),
            this.getDevice(),
            this.getDeviceLocation()
        ]).then( () => {
            this.startStation = this.stationList[0].Name;
            this.endStation = this.stationList[this.stationList.length - 1].Name;

            // 找到设备在当前那个站点或刚离开哪个站点
            let carStation = this.stationList.find( o => o.id == this.deviceLocation[0].station );
            let curStation = this.deviceStation( this.deviceLocation,  this.stationList);
            
            if (!carStation || this.deviceLocation[0].statu == 0) { // 如果没找到站点，则说明未发车
                this.stationList.unshift({
                    type: true // 用于识别在哪个站点添加设备标识
                });
            } else {
                this.curStationNum = carStation.Order;
                if (this.curStationNum == this.stationList[this.stationList.length - 1].Order) {
                    this.curStationNum = 0; return;
                }
                if (curStation.distance <= 50) { // 正在站点
                    carStation.type = true;
                } else {  // 上一站点与下一站点之间
                    let index = this.stationList.indexOf(carStation);
                    this.stationList.splice(index + 1, 0 , {
                        type: true
                    });
                }
            }
        })
    },

    methods: {
        toBack() {
            history.back(-1);
        },
        /** 获取指定车辆的站点信息 */
        getStation(){
            let data = this.createFormData({
                DeviceID: this.deviceId,
                timeid: this.timeId
            });
            return new Promise( (resolve, reject) => {
                let url = `${domain}/gps/index.php?m=Home&c=Location&a=getStation&code=${this.code}`
                this.$http.post(url, data).then( res => {
                    let data = res.data;
                    this.decState = data.state;
                    this.stationList = data.data;
                    resolve();
                }).catch(e => {
                    reject(`获取ID为${this.deviceId}的设备站点信息出错!, ${e}`,);
                });
            });
        },

        /** 获取指定车辆的位置信息 */
        getDeviceLocation(){
            let data = this.createFormData({
                DeviceID: this.deviceId,
                timeid: this.timeId
            });
            return new Promise( (resolve, reject) => {
                let url = `${domain}/gps/index.php?m=Home&c=Location&a=getLocation&code=${this.code}`;
                this.$http.post(url, data).then(res => {
                    if(res.data.length <= 0){ reject(`获取车辆位置信息出错，车辆数据为空！`); }
                    this.deviceLocation = res.data; resolve();
                }).catch(e => {
                    reject(`获取ID为${this.deviceId}的设备位置信息出错! , ${e}`);
                })
            });
        },

        getDevice() {
            let data = this.createFormData({
                timeid: this.timeId
            });
            return new Promise( (resolve, reject) => {
                let url = `${domain}/gps/index.php?m=Home&c=Location&a=getDevice&code=${this.code}`;
                this.$http.post(url, data).then(res => {
                    this.carInfo = res.data; resolve();
                }).catch(e => {
                    reject(`获取ID为${this.deviceId}的设备信息出错! , ${e}`);
                })
            });
        },

        /** 根据车辆的经纬度确定车辆最近站点 */
        deviceStation( device, stationList ){
            let deviceLngLat = [ device[0].baiduLng, device[0].baiduLat ];

            let arr = [];
            stationList.forEach( (o) => {
            let stationLngLat =  [o.Lng, o.Lat];

            // 得到车辆的位置到该线路所有公交站点的距离
            let distance = AMap.GeometryUtil.distance(deviceLngLat, stationLngLat);
                arr.push({distance, name: o.Name });
            });

            // 选出离车辆当前位置最近的站点
            arr.sort((a,b) => a.distance - b.distance );
            return arr[0];
        },

        toAttention(){
            let url = this.decState == 0 
                    ? `${domain}/gps/index.php?m=Home&c=Device&a=addFellow&code=${this.code}` 
                    : `${domain}/gps/index.php?m=Home&c=Device&a=delFellow&code=${this.code}`;
            let formData = this.createFormData({
                'DeviceID': this.deviceId,
                'timeid': this.timeId
            });
            this.$http.post(url, formData).then( (response) => {
                if (response.data.return) {
                    this.decState = this.decState == 0 ? 1 : 0;
                    this.showDialog('操作成功！');
                } else {
                    this.showDialog('操作失败！');
                }
            }).catch( (error) => {
                console.log(error);
            });
        },
        
    }
}
</script>


<style>
    .header{
        height: 3.3rem;
        background: #02a553;
        line-height: 3.3rem;
        color: #fff;
    }
    .header button.btn-back{
        height: 2rem;
        width: 4rem;
        border: none;
        border-radius: 5px;
        background: #0e8a56;
        color: #fff;
        position: absolute;
        left: 0.3rem;
        top: 0.6rem;
    }
    .header button.btn-attention{
        height: 2rem;
        width: 4.5rem;
        border: none;
        border-radius: 5px;
        background: #0e8a56;
        color: #fff;
        position: absolute;
        right: 0.3rem;
        top: 0.6rem;
    }
    .stations-s-e{
        background: #eff0f9fc;
        line-height: 3rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
    }
    .stations-s-e div {
        display: inline-block;
    }

    .stations-s-e div.left {
        float: left;
        width: 40%;
        text-align: right;
        line-height: 1.5rem;
    }
    .stations-s-e div.middle{
        float: left;
        width: 20%;
    }
    .stations-s-e div.right {
        width: 40%;
        float: left;
        text-align: left;
        line-height: 1.5rem;
    }

    .list ul li {
        margin: 0;
        padding: 0;
        line-height: 3.5rem;
        height: 3.5rem;
        border-bottom: 1px dotted #eaeaea;
        text-align: right;
        display: flex;
        align-items: center;
    }

    .list ul li span.station-name{
        width: 45%;
        padding-right: 0.3rem;
        line-height: 1.5rem;
    }

    .list ul li:first-child span::before {
        background: transparent !important;
    }
    .list ul li:last-child span::after {
        background: transparent !important;
    }

    .list ul li span.station-num,
    .list ul li span.station-num-gray,
    .list ul li span.car-marker {
        display: inline-block;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        line-height: 1.5rem;
        text-align: center;
        position: relative;
    }
    .list ul li span.station-num{
         border: 2px solid #088611;
    }
    .list ul li span.station-num-gray{
        border: 2px solid #ccc;
    }

    .list ul li span.car-marker{
        border: 2px solid transparent;
        background: url('../assets/img/icon_carDetailLocation.png') no-repeat;
        background-size: 1.5rem;
    }

    .list ul li span.station-num-gray::before, 
    .list ul li span.station-num-gray::after,
    .list ul li span.station-num::before, 
    .list ul li span.station-num::after,
    .list ul li span.car-marker::before,
    .list ul li span.car-marker::after {
        content: '';
        width: 0.1rem;
        height: 1.1rem;
        background: #088611;
        position: absolute;
        left: 0.7rem;
    }

    .list ul li span.car-marker::before,
    .list ul li span.station-num-gray::before,
    .list ul li span.station-num-gray::after {
        background: #ccc;
    }

    .list ul li span.station-num::before,
    .list ul li span.station-num-gray::before,
    .list ul li span.car-marker::before {
        top: -1.1rem;
    }

    .list ul li span.station-num::after,
    .list ul li span.station-num-gray::after,
    .list ul li span.car-marker::after {
        top: 1.5rem;
    }

    .list ul li span.car-num{
        display: inline-block;
        width: 10.6rem;
        text-align: left;
        color: #ff8f00;
        padding-left: 0.3rem;
    }

    .arrow-double-down-1{
        animation: transarrow1 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);
        -moz-animation: transarrow1 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        -webkit-animation: transarrow1 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);
        -o-animation: transarrow1 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);
        color: #088611;
    }
    .arrow-double-down-2{
        animation: transarrow2 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);
        -moz-animation: transarrow2 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        -webkit-animation: transarrow2 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        -o-animation: transarrow2 1.5s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        color: #088611;
    }
    /* .arrow-double-down-3{
        animation: transarrow3 1s infinite cubic-bezier(0.39, 0.58, 0.57, 1);
        -moz-animation: transarrow3 1s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        -webkit-animation: transarrow3 1s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        -o-animation: transarrow3 1s infinite cubic-bezier(0.39, 0.58, 0.57, 1);	
        color: #088611;
    } */

    @keyframes transarrow1
    {
    from {transform: translateY(1.1rem);}
    to {transform: translateY(1.8rem);}
    }


    @keyframes transarrow2
    {
    from {transform: translateY(0.3rem);}
    to {transform: translateY(1rem);}
    }

    @keyframes transarrow3
    {
    from {transform: translateY(-1.9rem);}
    to {transform: translateY(-0.5rem);}
    }
</style>
