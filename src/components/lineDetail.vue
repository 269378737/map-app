<template>
  <div class="lineDetail">
    <div id="container"></div>
    <div class="showBox">
      <div class="toAttention">
        <span class="toAttention_circle" v-show="decState==0" @click="toAttention">关注</span>
        <span class="toAttention_circle" v-show="decState==1" @click="toAttention">取消</span>
      </div>
      <div class="showBox_content">
        <div class="showBox_item clear_fix">
          <div>
            <img src="../assets/img/icon_adrDetail.png" alt="">
          </div>
          <div>{{ myLatestStation }}</div>
        </div>
        <div class="showBox_item clear_fix">
          <div>
            <img src="../assets/img/icon_carDetail.png" alt="">
          </div>
          <div v-if="isStart" @click="showPath"><span>距离你<span class="tip">{{ disStation }}</span>个站</span><span>大约需要<span class="tip">{{ times }}</span>分钟</span></div>
          <div v-else @click="showPath">{{ disStation }} <i class="fa fa-angle-right arrow-right"></i></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import {domain, wxUrl} from '@/assets/js/common-const-data'

  export default{
    data(){
      return {
        timer: null,
        deviceId: '',
        timeId: '',
        decState: 0,
        stationList: [],   //站点列表
        map: null, // 地图实例
        myLocationInfo: null, // 当前的定位信息
        myLatestStation: null, // 距离我最近的站点,
        disStation: null, // 车辆距离我多少站
        times: null, // 车辆所在地到 离我最近的站点所需时间（分）
        isStart: false, // 判断是否发车
        deviceLocation: null, //设备位置信息
        coverPrevArr: [], // 地图上除定位Marker外的覆盖物（上次添加）,
        isFirsGeoLocation: true, // 判断是否是第一次进行定位
        code: null,
        geolocation: null,
        courseName: { 
          dueNorth: "正北", 
          northeast: "东北", 
          dueEast: "正东", 
          southeast: "东南", 
          dueSouth: "正南", 
          southwest: "西南", 
          dueWest: "正西", 
          northwest: "西北" 
        },
        // ====由于定时器轮询，很多数据需要以单例模式保存，以防出现性能问题，下方数据应用于此======
        geoEventCompelete: null, // 保存定位事件监听对象--定位完成事件
        geoEventError: null, // 保存定位事件监听对象--定位出错事件
        deviceIcon: null, // 设备标注图标
        deviceMarker: null, // 设备标注对象
        stationMarkerArr: [], // 站点标注对象
        stationTextArr: [], // 站点文字描述对象
        infoWindow: null, // 设备信息窗体
        deviceIconEventClick: null, // 设置标注点击事件 
        polylineAllPath: null, // 整条路线
        polylineToMe: null, // 距离我最近站点的路线
        polylineWalk: null, // 我步行路线
      }
    },
    created: function () {
      this.deviceId = this.$route.params.id;
      this.timeId = this.$route.params.timeId;

      this.code = this.getQueryString('code');
      if (!this.code && process.env.NODE_ENV === 'production') {
        window.location.href = wxUrl;
      }
    },
    mounted(){
      this.polylineAllPath = this.createPolyline('#09f', 0.4, 52);
      this.polylineToMe = this.createPolyline('#09f', 0.8, 52);
      this.polylineWalk = this.createPolyline('#8cd34e', 0.8, 55);
      this.loadMap().then( () => {
        this.createGeolocation().then( () => {
          let run = () => {
            this.coverPrevArr = this.map.getAllOverlays(); // 获取地图上存在的覆盖物，不包括定位Marker
            Promise.all([
              this.getGeolocation(),
              this.getStation(),
              this.getDeviceLocation()
            ]).then( () => {
              Promise.all([
                this.carLocationMarker(),
                this.calculateArrive(),
                this.showLatestStation(),
                this.stationMarker(),

                this.driveingSearch(this.stationList, 0),
                this.fitView()
              ]).then( () => {
                this.map.remove(this.coverPrevArr);
              })
              
            }).catch( e => console.error('发生错误，错误原因：', e));
          }

          run();
          this.timer = setInterval( () => {
            this.isFirsGeoLocation = false;
            run()
          }, 15000);
          
        });
            
      });
    },
    beforeDestroy(){
      clearInterval(this.timer);
    },
    methods: {
      /** 创建地图，保存地图实例 */
      loadMap(){
        return new Promise( (resolve, reject) => {
          this.map = new AMap.Map('container', {
            zoom: 13,
            resizeEnable: true, // 控制地图是否可以通过鼠标滚动来放大缩小
            dragEnable: true, // 设置地图是否可以拖拽
            features: ['bg', 'road']
          }); resolve();
        });
      },
      /** 站点标注 */
      stationMarker(){
        // 清空数组
        this.stationMarkerArr.length = 0;
        this.stationTextArr.length = 0;
        this.stationList.forEach( (o, index) => {
          let stationLngLat = [ o.Lng, o.Lat ];
          let content = `<div class="marker-content">${o.Name}</div>`

          let icon = new AMap.Icon({
            image : index == 0 
                    ? 'https://webapi.amap.com/theme/v1.3/markers/n/start.png' : index == this.stationList.length - 1 
                    ? 'https://webapi.amap.com/theme/v1.3/markers/n/end.png' 
                    : 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png'
          });

          // 添加水滴标注
          let marker = this.createMarker({
            location: stationLngLat,
            offset: new AMap.Pixel(-10,-30),
            img: icon
          });
          // 添加文字标注
          let text = this.createMarker({
            location: stationLngLat,
            content: content,
            offset: new AMap.Pixel(-50,-55)
          });
          if (index != 0 && index != this.stationList.length - 1) {
            this.stationMarkerArr.push(marker);
            this.stationTextArr.push(text);
          }
        });

        // 根据地图缩放级别显示隐藏站点文字与标注
        this.map.on('zoomend' ,() => {
          let zoom = this.map.getZoom();
          // 缩放级别<= 15时 隐藏文字
          if (zoom <= 15) { 
            this.stationTextArr.forEach( o => o.hide())
          } else {
            this.stationTextArr.forEach( o => o.show())
          }
          if (zoom <= 13) {
            this.stationMarkerArr.forEach( o => o.hide())
          } else {
            this.stationMarkerArr.forEach( o => o.show())
          }
        });
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
        }).catch(function (error) {
          console.log(error);
        });
      },
      
      /** 计算车辆离我最近站还有几个站以及多久到达 */
      calculateArrive( ){
        let curStation = this.deviceStation( this.deviceLocation,  this.stationList);
        let my = this.disLatestStation( this.stationList );

        let tempMy = this.stationList.find( o => o.Name == my.name );
        let tempCur = this.stationList.find( o => o.Name == curStation.name );

        // statu : 0 未发车， 1 已发车
        if(!this.deviceLocation[0].statu) {
          this.disStation = '暂未发车'; return;
        }

        // 判断是否快到下一个站
        // 如果车辆的station 字段比距离车辆最近站点的ID 值大或相等，说明车辆离开了站点，小于则是快要进站了
        let isToNextStaton = this.deviceLocation[0].station < tempCur.id;
        if( this.deviceLocation[0].station < tempMy.id) {
          this.isStart = true;
          this.disStation = tempMy.Order - tempCur.Order;

          // 计算车辆离 我附近最近的站点的距离(米)，并计算出所需时长
          let distance = AMap.GeometryUtil.distance([tempMy.Lng, tempMy.Lat], [ tempCur.Lng, tempCur.Lat ]);
          this.times = this.deviceLocation[0].speedAvg == 0 ? '-' : Math.round(((distance / 1000) / parseFloat(this.deviceLocation[0].speedAvg)) * 60);
        } else if (this.deviceLocation[0].station == tempMy.id && curStation.distance <= 50) {
          this.isStart = false;
          this.disStation = `已到站`;
        } else {
          this.isStart = false;
          this.disStation = `已经驶离最近站点`;
        }
      },

      /** 标注车辆位置 */
      carLocationMarker(){
        let deviceLngLat = [ this.deviceLocation[0].baiduLng, this.deviceLocation[0].baiduLat ];
        if (!this.deviceIcon) {
          this.deviceIcon = new AMap.Icon({
            image : './static/img/icon_carDetailLocation.png',
            imageSize: new AMap.Size(40,40),
            size : new AMap.Size(40,40),
          });
        }
        
        // 标注车辆位置
        this.deviceMarker = this.createMarker({
          location: deviceLngLat,
          offset: new AMap.Pixel(-20,-25),
          img: this.deviceIcon
        });

        // 添加信息窗体，鼠标点击车辆标注时打开信息窗体
        if (this.isFirsGeoLocation) {
          let info = [];
          info.push(`<b>${this.deviceLocation[0].name}</b>`);
          info.push(`状态：${this.deviceLocation[0].status == 'Stop' ? '静止' : this.deviceLocation[0].status == 'Offline' ? '离线 ' : '行驶'}`);
          info.push(`定位时间：${this.deviceLocation[0].deviceUtcDate}`);
          info.push(`方向：${this.getCourseName(this.deviceLocation[0].course)}`);
          info.push(`速度：${parseFloat(this.deviceLocation[0].speed).toFixed(2)}公里/小时`);
          this.infoWindow = new AMap.InfoWindow({
              content: info.join("<br/>") 
          });
        }

        AMap.event.removeListener(this.deviceIconEventClick);
        this.deviceIconEventClick = AMap.event.addListener(this.deviceMarker, 'click', () => {
            this.infoWindow.open(this.map, this.deviceMarker.getPosition());
        });
      },

      /** 在地图上显示距离我最近的站点 */
      showLatestStation(){
        let station = this.disLatestStation(this.stationList);
        this.myLatestStation = station.name;
      },

      /** 绘制各路线并根据路线大小缩放 */
      fitView(){
        this.driveingSearch( this.drawCarToLine(), 1 );
        this.walkingSearch(this.drayMyToLine());
       
        // 自动缩放适应
		    // let line1 = this.lineSearch( this.drawCarToLine() );
        // let line2 = this.lineSearch( this.drayMyToLine() );
        this.map.setFitView(this.map.getAllOverlays());

        this.map.setZoom( this.map.getZoom() - 1);
      },

      /*************************************************分割线******************************************/
      /** 创建定位对象 */
      createGeolocation() {
        return new Promise( (resolve, reject) => {
          this.map.plugin('AMap.Geolocation', () => {
            this.geolocation = new AMap.Geolocation({
              enableHighAccuracy: true,//是否使用高精度定位，默认:true
              timeout: 10000,          //超过10秒后停止定位，默认：无穷大
              maximumAge: 0,           //定位结果缓存0毫秒，默认：0
              convert: true,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
              showButton: true,        //显示定位按钮，默认：true
              buttonPosition: 'LB',    //定位按钮停靠位置，默认：'LB'，左下角
              buttonOffset: new AMap.Pixel(9, 110),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
              showMarker: this.isFirsGeoLocation,        //定位成功后在定位到的位置显示点标记，默认：true
              markerOptions: {
                icon:  new AMap.Icon({
                  image : './static/img/icon_adrDetail.png',//24px*24px
                  imageSize: new AMap.Size(30,35),
                  size : new AMap.Size(30,35)
                }),
                offset: new AMap.Pixel(-15,-30),
              },        // 定位点Marker设置
              showCircle: false,        //定位成功后用圆圈表示定位精度范围，默认：true
              panToLocation: false,     //定位成功后将定位到的位置作为地图中心点，默认：true
              zoomToAccuracy: true,      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
              useNative: true,
              GeoLocationFirst: false,   // 使用浏览器定位比较慢
              noIpLocate: 0,
              noGeoLocation: process.env.NODE_ENV === 'production' ? 2 : 3
              // buttonDom: '<i class="el-icon-location-outline"></i>'
            });
            
            this.map.addControl(this.geolocation);
            resolve();
          });
        });
      },

      /** 绑定定位事件 */
      getGeolocation() {
        return new Promise( (resolve, reject) => {
          AMap.event.removeListener(this.geoEventCompelete);
          AMap.event.removeListener(this.geoEventError);
          this.geolocation.getCurrentPosition();
          this.geoEventCompelete = AMap.event.addListener(this.geolocation, 'complete', (res) => {
            this.myLocationInfo = res; resolve();
          });//返回定位信息
          this.geoEventError = AMap.event.addListener(this.geolocation, 'error', (e) => {
            alert("定位失败");
            reject(e);
          });      //返回定位出错信息
        });
      },
      
      // 计算方向
      getCourseName(course){
        let name = "";
        course = parseFloat(course);
        if ((course >= 0 && course < 22.5) || (course >= 337.5 && course < 360)) {
            name = this.courseName.dueNorth; //北
        } else if (course >= 22.5 && course < 67.5) {
            name = this.courseName.northeast;  //东北
        } else if (course >= 67.5 && course < 112.5) {
            name = this.courseName.dueEast; //正东
        } else if (course >= 112.5 && course < 157.5) {
            name = this.courseName.southeast; //东南
        } else if (course >= 157.5 && course < 202.5) {
            name = this.courseName.dueSouth; //正南
        } else if (course >= 202.5 && course < 247.5) {
            name = this.courseName.southwest; //西南
        } else if (course >= 247.5 && course < 292.5) {
            name = this.courseName.dueWest; //正西
        } else if (course >= 292.5 && course < 337.5) {
            name = this.courseName.northwest; //西北
        } else {
            name = "--";
        }
        return name;
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
          })
        })

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

      /** 获取距离我的位置最近的公交站点 */
      disLatestStation( stations ){
        let myLngLat = [this.myLocationInfo.position.lng, this.myLocationInfo.position.lat];
        let arr = [];
        stations.forEach( (o) => {
          let stationLngLat =  [o.Lng, o.Lat];

          // 得到我的位置到该线路所有公交站点的距离
          let distance = AMap.GeometryUtil.distance(myLngLat, stationLngLat);
          arr.push({distance, name: o.Name });
        });

        // 选出离我的位置最近的站点
        arr.sort((a,b) => a.distance - b.distance );
        return arr[0];
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

      /** 绘制标注 */
      createMarker({location, img, offset, content }) {
        // 在地图上标注车辆当前位置
        let marker = new AMap.Marker({
          content: content || '',
          icon : img,
          position : location,
          offset : offset,
          map : this.map
        })
        return marker;
      },

      /** 封装我到最近站点的路线数据 */
      drayMyToLine(){
        let latestStation = this.disLatestStation( this.stationList );
        let tempStation = this.stationList.find( o => o.Name == latestStation.name );
        let lineArr = [
          {
            Lng: this.myLocationInfo.position.lng,
            Lat: this.myLocationInfo.position.lat
          },
          tempStation
        ];
        return lineArr;
      },

      /** 封装车辆到我最近站点路线数据 */
      drawCarToLine(){
        let curStation = this.deviceStation( this.deviceLocation,  this.stationList);
        let my = this.disLatestStation( this.stationList );

        let tempMy = this.stationList.find( o => o.Name == my.name );
        let tempCur = this.stationList.find( o => o.Name == curStation.name );  

        // 判断是否快到下一个站
        // 如果车辆的station 字段比距离车辆最近站点的ID 值大或相等，说明车辆离开了站点，小于则是快要进站了
        let isToNextStaton = this.deviceLocation[0].station < tempCur.id;

        // 只绘制车辆还没到离我最近站点的路线
        if( this.deviceLocation[0].station < tempMy.id ){
          let indexCarStation = this.stationList.indexOf(tempCur);
          let indexMyStation = this.stationList.indexOf(tempMy);

          // 如果车辆快要进站了， 则从快要进站的站点开始绘制路线，否则从下一个站开始绘制
          let sliceArr = this.stationList.slice( isToNextStaton ? indexCarStation : indexCarStation + 1, indexMyStation + 1);

          // 将车辆到下一站的路线添加到绘制中
          sliceArr.unshift({
            Lng: this.deviceLocation[0].baiduLng,
            Lat: this.deviceLocation[0].baiduLat
          })

          return sliceArr;
        } 
        return [];
      },

      /** 步行路线规划 */
      walkingSearch(data) {
        let searchPath = data.map( o => {
          return [ parseFloat(o.Lng), parseFloat(o.Lat) ]
        });
        let walk;
        
        AMap.service(["AMap.Walking"], () => {
          walk = new AMap.Walking(); 
          walk.search(searchPath[0], searchPath[1], (status, result) => {
              let steps = result.routes[0].steps;
              let tempPath = steps.reduce( (a, b) => a.concat(b.path), [])
              // this.polylineWalk.setPath(tempPath)
              // this.polylineWalk.setMap(this.map)
              let poy = new AMap.Polyline({
                  //map: this.map,
                  path: tempPath,          //设置线覆盖物路径
                  strokeColor: "#8cd34e", //线颜色
                  strokeOpacity: 0.8,       //线透明度
                  strokeWeight: 7,        //线宽
                  strokeStyle: "solid",   //线样式
                  showDir: true,
                  zIndex:55
              })
              // poy.setMap(this.map);
              //poy = null;
          });
        });
      },



      /** 驾车路线规划 */
      driveingSearch(statons, type){
        //构造路线导航类
        AMap.service(["AMap.Driving"], () => {
          let driving = new AMap.Driving(); 
          statons.forEach( (o, index) => {
            if (index != 0) {
              let prevStation = statons[index - 1];
              
              driving.search( [prevStation.Lng, prevStation.Lat], [o.Lng, o.Lat], (status, result) => {
                let steps = result.routes[0].steps;
                let tempPath = steps.reduce( (a, b) => a.concat(b.path), []);
                let poy = new AMap.Polyline({
                  map: this.map,
                  path: tempPath,          //设置线覆盖物路径
                  strokeColor: "#09f", //线颜色
                  strokeOpacity: type == 0 ? 0.4 : 0.8,       //线透明度
                  strokeWeight: 7,        //线宽
                  strokeStyle: "solid",   //线样式
                  showDir: true,
                  zIndex:52
                })
                // poy.setMap(this.map);
                // //poy = null;
                // if (type == 0) {
                //   console.log(this.polylineAllPath);
                //   this.polylineAllPath.setPath(tempPath);
                //   this.polylineAllPath.setMap(this.map);
                // } else {
                //   this.polylineToMe.setPath(tempPath)
                //   this.polylineToMe.setMap(this.map);
                // }
              });
            }
          });
        });
      },
      

      /** 绘制路线 */
      createPolyline(color, opacity, zIndex) {
        return new AMap.Polyline({
          // map: this.map,
          strokeColor: color, //线颜色
          strokeOpacity: opacity,       //线透明度
          strokeWeight: 7,        //线宽
          strokeStyle: "solid",   //线样式
          showDir: true,
          zIndex:zIndex
        });
      },

      showPath() {
        this.$router.push({ name: 'linePath', params: { id: this.deviceId, timeid: this.timeId }});
      },

      /** 绘制两点间直线 
       * 暂时无用
       */
      lineSearch( data ){
        let searchPath = data.map( o => {
          return [ o.Lng, o.Lat ]
        });
        var polyline = new AMap.Polyline({
            path: searchPath,          //设置线覆盖物路径
            strokeColor: "#09f", //线颜色
            strokeOpacity: 0,       //线透明度
            strokeWeight: 5,        //线宽
            strokeStyle: "dashed",   //线样式
            // showDir: true,
        });
        polyline.setMap(this.map);
        return polyline;
      },

    }
  }
</script>
<style>
  .lineDetail {
    height: 100%;
  }
  .amap-logo, .amap-copyright{
    display: none !important;
  }
  .marker-content{
    width: 100px;
    color: #fff;
    background: dodgerblue;
    border-radius: 5px;
    box-shadow: 0 2px 5px #797878;
    line-height: 24px;
    font-size: 14px;
  }

  #container {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .lineDetail .toAttention {
    text-align: right;
    margin-bottom: 1.17rem;
  }

  .lineDetail .toAttention_circle {
    display: inline-block;
    width: 3.1rem;
    height: 3.1rem;
    border-radius: 100%;
    background: rgba(248, 105, 0, .75);
    color: #ffffff;
    line-height: 3.1rem;
    font-size: .87rem;
    text-align: center;
  }

  .lineDetail .showBox {
    width: 100%;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
    padding: 0 .59rem;
    position: fixed;
    bottom: 0;
  }

  .lineDetail .showBox_content {
    background-color: #fff;
    margin-bottom: .59rem;
    -webkit-box-shadow: 0 0 40px 5px #d2d2d2;
    -moz-box-shadow: 0 0 40px 5px #d2d2d2;
    box-shadow: 0 0 40px 5px #d2d2d2;
  }

  .lineDetail .showBox_content > div:first-child > div:last-child {
    border-bottom: 1px solid #d2d2d2
  }

  .lineDetail .showBox_item > div:first-child {
    float: left;
    width: 2.34rem;
    text-align: center;
    padding-top:.72rem;
  }

  .lineDetail .showBox_item img {
    width: 1.3rem;
    height: auto;
  }

  .lineDetail .showBox_item > div:last-child {
    margin-left: 2.34rem;
    font-size: .87rem;
    text-align: left;
    padding: .72rem 0;
    min-height:.87rem;
  }

  .lineDetail .showBox_item .tip {
    color: #a1b0d7;
  }

  .lineDetail .showBox_item > div > span:last-child {
    margin-left: 1.17rem;
  }

  .arrow-right{
    float: right;
    margin-right: 1rem;
    margin-top: 0.2rem;
  }
</style>
