var Mock = require('mockjs');

var Random = Mock.Random;

var template = {
  'data': [
      {
        "Name": "站点1",
        "Order": 1,
        "Lat": 30.525843,
        "Lng": 104.042131
      },{
        "Name": "站点2",
        "Order": 2,
        "Lat": 30.526731,
        "Lng": 104.058182
      },{
        "Name": "站点3",
        "Order": 3,
        "Lat": 30.526805,
        "Lng": 104.067194
      },{
        "Name": "站点4",
        "Order": 4,
        "Lat": 30.530501,
        "Lng": 104.069769
      },{
        "Name": "站点5",
        "Order": 5,
        "Lat": 30.534198,
        "Lng": 104.069855
      },{
        "Name": "站点6",
        "Order": 6,
        "Lat": 30.54196,
        "Lng": 104.069683
      },{
        "Name": "站点7",
        "Order": 7,
        "Lat": 30.550165,
        "Lng": 104.069425
      },{
        "Name": "站点8",
        "Order": 8,
        "Lat": 30.551274,
        "Lng": 104.060242
      }
  ],
}


var template1 = [{
        "DeviceID": "583217",
        "name": "GT021-02646",
        "sn": "353602100002646",
        "model": "78",
        "modelName": "GT021",
        "state": "-1",
        "speedLimit": "100.00",
        "icon": "30",
        "carNum": "",
        "locationID": "1",
        "groupID": "-1",
        "serverUtcDate": "2018-03-01 10:48:50",
        "deviceUtcDate": "2018-03-01 10:48:50",
        "baiduLat": "30.528209",
        "baiduLng": "104.070026",
        "speed": "30.00",
        "course": "998",
        "dataType": "3",
        "dataContext": "0,83,64",
        "distance": "2.4467",
        "isStop": "1",
        "stopTimeMinute": "7",
        "carStatus": "",
        "status": "Offline",
        "time": "1521161926"
  }];
Mock.mock(`/api/gps/index.php/Location/getStation`,template)
Mock.mock(`/api/gps/index.php/Location/getLocation`,template1)