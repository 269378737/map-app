export const domain = process.env.NODE_ENV === 'production' ? '/bus' : '/api';

const appid = `wx154616c910728510`;
const redirect_url = `http://cert.myhiott.com/bus/gpsWeb/`;
export const wxUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_url}&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect`;








