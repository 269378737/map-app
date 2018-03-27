import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const router=new Router({
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {x: 0, y: 0}
    }
  },

  routes: [
    {
      path: '/',
      name: 'attentionLine',
      component: resolve => require(['@/components/attentionLine'], resolve),
      meta: {
        title: '关注路线'
      }
    },
    {
      path: '/allLine',
      name: 'allLine',
      component: resolve => require(['@/components/allLine'], resolve),
      meta: {
        title: '全部路线'
      }
    },
    {
      path: '/lineDetail/:id',
      name: 'lineDetail',
      component: resolve => require(['@/components/lineDetail'], resolve),
      meta: {
        title: '路线详情'
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next()
});

export default router;
