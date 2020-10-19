#### 快照
```shell
sh snapshot.sh 流地址参数 快照输出路径参数
#sh snapshot.sh rtsp://admin:test123456@192.168.100.46/h264/ch1/main/av_stream /home/linxinqiang/Desktop/test.jpeg
```
#### 转换脚本
```shell
sh rtsp2http.sh rtsp://admin:test123456@192.168.100.46/h264/ch1/main/av_strea http://127.0.0.1:8082/deviceId1/123456/640/480/
sh rtsp2http.sh rtsp://admin:admin@192.168.10.23:554/video1 http://127.0.0.1:8082/deviceId2/123456/640/480/
```
#### 启动摄像头服务
```shell
node websocket-relay.js 123456 8082 8084 8087
```