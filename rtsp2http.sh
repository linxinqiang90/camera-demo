#ffmpeg  -i "$1" -f mpeg1video -b:v 800k -r 30 http://localhost:8082/123456/640/480/
#ffmpeg -s 640x480 -i "$1" -f mpeg1video -b 800k -r 30 http://localhost:8082/123456/640/480/
#ffmpeg -rtsp_transport tcp -i "$1" -f mpeg1video -b:v 800k -r 30 http://127.0.0.1:8082/123456/640/480/
ffmpeg -rtsp_transport tcp -i "$1" -f mpegts -b:v 800k -codec:v mpeg1video -codec:a mp2 -s 640x480 -r 32 "$2"
