// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import axios from 'axios'
import '@/assets/css/common.css'
import 'font-awesome/css/font-awesome.min.css'
import App from './App.vue'
import router from './router/router'
import * as CommonApi from '@/assets/js/common-api.js'
// import './mock/mock.js'
Vue.use(CommonApi);

Vue.config.productionTip = false;
Vue.prototype.$http = axios;

//初始化地图前先判断系统并设置不同的key
var u = navigator.userAgent, mapKey;
var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
mapKey = isiOS ? 'e3e150a5576e7b64bc394c421ed3906d' : '0ae5645b0e673a67c4246e461ed405f9';

new Vue({
  el: '#app',
  router,
  components: {App},
  template: '<App/>',
  render: h => h(App)
}).$mount('#app')
