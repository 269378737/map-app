var Mock = require('mockjs');

var Random = Mock.Random;

var template = {
  'data': [
      {
        "Name": "站点1",
        "Order": 1,
        "Lat": 30.525843,
        "Lng": 104.042131,
        "id": 1
      },{
        "Name": "站点2",
        "Order": 2,
        "Lat": 30.526731,
        "Lng": 104.058182,
        "id": 2
      },{
        "Name": "站点3",
        "Order": 3,
        "Lat": 30.526805,
        "Lng": 104.067194,
        "id": 3
      },{
        "Name": "站点4",
        "Order": 4,
        "Lat": 30.530501,
        "Lng": 104.069769,
        "id": 4
      },{
        "Name": "站点5",
        "Order": 5,
        "Lat": 30.534276,
        "Lng": 104.069678,
        "id": 5
      },{
        "Name": "站点6",
        "Order": 6,
        "Lat": 30.54196,
        "Lng": 104.069683,
        "id": 6
      },{
        "Name": "站点7",
        "Order": 7,
        "Lat": 30.550165,
        "Lng": 104.069425,
        "id": 7
      },{
        "Name": "站点8",
        "Order": 8,
        "Lat": 30.551274,
        "Lng": 104.060242,
        "id": 8
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
        "baiduLat": "30.526846",
        "baiduLng": "104.063203",
        "speed": "30.00",
        "course": "998",
        "dataType": "3",
        "dataContext": "0,83,64",
        "distance": "2.4467",
        "isStop": "1",
        "stopTimeMinute": "7",
        "carStatus": "",
        "station": 7,
        "statu": 1,
        "status": "Offline",
        "time": "1521161926"
  }];
Mock.mock(`/api/gps/index.php?m=Home&c=Location&a=getStation&code=null`,template)
Mock.mock(`/api/gps/index.php?m=Home&c=Location&a=getLocation&code=null`,template1)