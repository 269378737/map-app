exports.install = function (Vue, options) {
  Vue.prototype.showDialog = function (msg) {
    let dialog = `<div id="dialog">
       <div id="dialog_content">${msg}</div>
</div>`;
    if ($('#dialog').length > 0) { $('#dialog').remove(); }
    $('body').append(dialog);
    $('#dialog_content').addClass('scale');
    let timer = setTimeout(function () {
      $('#dialog').fadeOut();
      clearTimeout(timer);
    }, 1500)
  };

  /**
   * 创建FormData提交对象
   * @param {　调用接口时所需参数　} obj 
   */
  Vue.prototype.createFormData = function( obj ){
    let formData = new FormData();
    
    for(let key in obj){
        if(obj.hasOwnProperty(key)){
            formData.append(key, obj[key]);
        }
    }

    return formData;
  }

  /**
   * 获取url上参数
   * @param {获取指定参数的key} name 
   */
  Vue.prototype.getQueryString = function (name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)","i");
    var r = window.location.search.substr(1).match(reg);
    if (r!=null) return unescape(r[2]); return null;
  }

};
