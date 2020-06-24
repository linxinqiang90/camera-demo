var fs = require('fs'),
  http = require('http'),
  WebSocket = require('ws');

if (process.argv.length < 3) {
  console.log(
    'Usage: \n' +
    'node websocket-relay.js <secret> [<stream-port> <websocket-port>]'
  );
  process.exit();
}

var STREAM_SECRET = process.argv[2],
  STREAM_PORT = process.argv[3] || 8081,
  WEBSOCKET_PORT = process.argv[4] || 8082,
  HTTP_PORT = process.argv[5] || 8083,
  RECORD_STREAM = false;

// Websocket Server
var socketServer = new WebSocket.Server({port: WEBSOCKET_PORT, perMessageDeflate: false});
socketServer.connectionCount = 0;
socketServer.on('connection', function (socket, upgradeReq) {

  var params = upgradeReq.url.substr(1).split('/');
  if (!params || params.length != 1) {
    console.log("deviceId param was loss");
    response.end();
  }
  socket.deviceId = params[0];
  socketServer.connectionCount++;
  console.log(
    'New WebSocket Connection: ',
    (upgradeReq || socket.upgradeReq).socket.remoteAddress,
    (upgradeReq || socket.upgradeReq).headers['user-agent'],
    '(' + socketServer.connectionCount + ' total)'
  );
  socket.on('close', function (code, message) {
    socketServer.connectionCount--;
    console.log(
      'Disconnected WebSocket (' + socketServer.connectionCount + ' total)'
    );
  });
  socketServer.broadcast("fda")
});
socketServer.broadcast = function (deviceId, data) {
  socketServer.clients.forEach(function each(client) {
    if (client.deviceId && client.deviceId == deviceId) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });
};

// HTTP Server to accept incomming MPEG-TS Stream from ffmpeg
var streamServer = http.createServer(function (request, response) {
  var params = request.url.substr(1).split('/');

  if (params[1] !== STREAM_SECRET) {
    console.log(
      'Failed Stream Connection: ' + request.socket.remoteAddress + ':' +
      request.socket.remotePort + ' - wrong secret.'
    );
    response.end();
  }

  response.connection.setTimeout(0);
  console.log(
    'Stream Connected: ' +
    request.socket.remoteAddress + ':' +
    request.socket.remotePort
  );
  request.on('data', function (data) {
    socketServer.broadcast(params[0], data);
    if (request.socket.recording) {
      request.socket.recording.write(data);
    }
  });
  request.on('end', function () {
    if (request.socket.recording) {
      request.socket.recording.close();
    }
  });

  // Record the stream to a local file?
  if (RECORD_STREAM) {
    var path = 'recordings/' + Date.now() + '.ts';
    request.socket.recording = fs.createWriteStream(path);
  }
})
// Keep the socket open for streaming
streamServer.headersTimeout = 0;
streamServer.listen(STREAM_PORT);

// HTTP Server to start convert shell
const express = require('express');
const bodyParser = require('body-parser');
const child_process = require('child_process');

const httpServer = express();
httpServer.use(bodyParser());
httpServer.use(bodyParser.json());
httpServer.use(bodyParser.urlencoded({extended: true}));

httpServer.killByProcessName = function (name) {
  var shell = `ps aux | grep "${name}" |grep -v grep| cut -c 9-15 | xargs kill -9`;
  try {
    console.log("exec", shell);
    var result = child_process.execSync(shell, {stdio: 'ignore'});
    console.log("进程已存在", result);
  } catch (e) {
    console.log("进程不存在（假定只有不存在的时候才会报错）")
    return false;
  }
  return true;
}

httpServer.get('/', function (req, res) {
  res.send('摄像头服务');
});
const error_image = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAF3AfQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooqCS4C8D86aTexMpqKuyfNFZ7XR9TSJelTzyKv2cjFYmNzRopkciyoGU5FPrM3TvqgooooGFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUU1nVBlmAHvQsiOu5GDD1FArq9h1FFFAwooooAKKKM0AFFIXUdWFN8xP7wosLmS6j6KZ5qf3hTgynoQaLApJ7MWiiigYUUVFcSiKIt37UJX0FJqKuyG5uAuVB+tZzzZPWo5pixPNVy9dtOlZHlVKrnK7JjJTTJUO/mkLVtykXL9neeTMAx+RuD7VuA5rkt1dBpk/nWgBOWT5T/SubEU7e8jswtS/uMu1BeTeRau/fGB9anrI1ebI2Z4Qbj9awpx5pJHRWnyQbLunymaxjdjknPP4mrVVNNQpp1uD1KA/nzVulO3M7Fw+FBRRRUlBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFNdgilj0AyadVPUpfKtPd2C04q7sTOXLFs57X9RZZAgJHGcVmaRrj2uoRqzExOwVgT696q+JLjGouuemBWB55DZB5Fekork5TzIt35up7TRUVu5ktopD/ABID+YpZZVjXnr2Febboeo5JK7HkgDk1E1wo4UZqs8jOfm/Km5rRQ7nFPFX+EmM7nuBTCxPUmmZpapRRg6knuxc0hNJm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"
httpServer.get('/snapshot', function (req, res) {
  if (!req.query.deviceId || !req.query.streamUrl) {
    res.json({succee: false, msg: "缺少参数"});
    return;
  }
  try {
    var frameShell = `ffmpeg -y -i "${req.query.streamUrl}" -ss 1 -frames:v 1 ./${req.query.deviceId}.jpeg`;
    console.log("snapshot", frameShell);
    child_process.execSync(frameShell, {stdio: 'ignore'});
    let bitmap = fs.readFileSync(`./${req.query.deviceId}.jpeg`);
    let base64str = Buffer.from(bitmap, 'binary').toString('base64');
    res.send("data:image/jpg;base64," + base64str);
    return;
  } catch (e) {
    console.log("在抓帧时获得异常，返回默认", e)
  }
  res.send(error_image);
});
httpServer.post('/camera', function (req, res) {
  console.log(req.body)
  if (!req.body.deviceId || !req.body.streamUrl) {
    res.json({succee: false, msg: "缺少参数"});
    return;
  }
  var exist = httpServer.killByProcessName(`http://127.0.0.1:8082/${req.body.deviceId}`);
  var cmd = `ffmpeg -rtsp_transport tcp -i "${req.body.streamUrl}" -f mpegts -b:v 800k -codec:v mpeg1video -codec:a mp2 -s 640x480 -r 32 "http://127.0.0.1:8082/${req.body.deviceId}/123456/640/480/"`;
  try {
    child_process.exec(cmd, function (error, stdout, stderr) {
      if (error) {
        console.log(error)
      }
      console.log("error:" + error);
      console.log("stdout:" + stdout);
      console.log("stderr:" + stderr);
    });
    console.log(`添加[${req.body.deviceId}:${req.body.streamUrl}]成功！`)
  } catch (e) {
    console.log(`添加[${req.body.deviceId}:${req.body.streamUrl}]失败！`, e)
    return res.json({succee: false, msg: "添加失败！"})
  }
  exist ? res.json({succee: true, msg: "已启动脚本！"}) : res.json({succee: true, msg: "已重启脚本！"});
});
httpServer.listen(HTTP_PORT);

console.log('Listening for incomming MPEG-TS Stream on http://127.0.0.1:' + STREAM_PORT + '/<secret>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + WEBSOCKET_PORT + '/');
console.log('Web Api service on http://127.0.0.1:' + HTTP_PORT + '/');
