exports.install = function (Vue, options) {
  Vue.prototype.showDialog = function (msg) {
    let dialog = `<div id="dialog">
       <div id="dialog_content">${msg}</div>
</div>`;
    if ($('#dialog').length == 0) {
      $('body').append(dialog);
      setTimeout(function () {
        $('#dialog').remove();
      }, 3000)
    }
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

};
