const http = require('http');
const urltool = require('url');
const fs = require('fs');
const zlib = require('zlib');
const util = require('util');

// promise
const gzip = util.promisify(zlib.gzip);
const readFile = util.promisify(fs.readFile);
const stat = util.promisify(fs.stat);

//PieServer
var PieServer = function() {
    //web根目录地址
    let rootdir = '/Users/pikay/开发/PrivateGit/前端工具/转图片转base64';

    //空目录的引用文件名
    let indexFileName = "index.html";

    Object.defineProperties(this, {
        "rootdir": {
            set: (val) => {
                rootdir = val
            },
            get: () => {
                return rootdir;
            }
        },
        "indexName": {
            set: (val) => {
                indexFileName = val;
            },
            get: () => {
                return indexFileName;
            }
        }
    });

    //MIMEMap类型返回
    let mimeMap = this.mimeMap = {
        ".bmp": "image/bmp",
        ".png": "image/png",
        ".gif": "image/gif",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".html": "text/html",
        ".htm": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".appcache": "text/cache-manifest",
        ".json": "application/json"
    }

    //创建服务器
    let server = this.server = http.createServer();

    //监听变动
    server.on('request', async(request, respone) => {
        //转换成url对象，方便后续操作
        let urlObj = urltool.parse(request.url);

        //获取pathname，并修正文件地址
        let { pathname } = urlObj;
        if (/\/$/.test(pathname)) {
            pathname += indexFileName;
        }
        pathname = rootdir + pathname;

        //请求头
        let headers = request.headers;

        //返回头
        let headData = {
            // 服务器类型
            'Server': "PieServer",
            //添加max-age（http1.1，一直缓存用；免去使用Etag和lastModify判断，只用版本号控制）
            // 'Cache-Control': "max-age=315360000"
        };

        //获取后缀并设置返回类型
        let suffix = /(.+)(\..+)$/g.exec(pathname.toLowerCase());
        suffix = suffix && suffix[2];

        //mime类型
        let mime;
        if (suffix) {
            mime = mimeMap[suffix];
            if (mime) {
                headData['Content-Type'] = mime;
            }
        }

        //图片的话断流返回数据
        if (mime && mime.search('image') > -1) {
            let imgstat = await stat(pathname);
            //存在图片才返回
            if (imgstat) {
                //设置文件大小
                headData['Content-Length'] = imgstat.size;

                //写入头数据
                respone.writeHead(200, headData);
                let readStream = fs.createReadStream(pathname);

                readStream.on('data', (chunk) => {
                    if (respone.write(chunk) === false) {
                        // 如果没有写完，暂停读取流
                        readStream.pause();
                    }
                });

                respone.on('drain', () => {
                    // 写完后，继续读取
                    readStream.resume();
                });

                //获取数据结束
                readStream.on('end', () => {
                    respone.end();
                });
            } else {
                //不存在就返回错误
                respone.writeHead(404);
                respone.end("error : no data");
            }
        } else {
            //获取文件
            let file = await readFile(pathname);

            //存在文件
            if (file) {
                //判断非图片
                //判断能接受gzip类型
                let acceptCode = headers['accept-encoding'];
                if (acceptCode && acceptCode.search('gzip') > -1) {
                    //转换gzip
                    file = await gzip(file);

                    //添加gz压缩头信息
                    headData['Content-Encoding'] = 'gzip';
                }

                //设置文件大小
                headData['Content-Length'] = file.length;

                //存在文件，就返回数据
                respone.writeHead(200, headData);
                respone.end(file);
            } else {
                //不存在就返回错误
                respone.writeHead(404);
                respone.end("error : no data");
            }
        }

        console.log(pathname, request);
    });
};

PieServer.prototype = {
    //监听端口
    listen: function(port) {
        this.server.listen(port);
    },
    //事件监听
    on: function() {
        this.server.on.apply(this.server, arguments);
    }
};

Object.defineProperties(PieServer.prototype, {
    //获取监听接口
    "port": {
        get: function() {
            return this.server.address().port;
        }
    }
});

module.exports = PieServer;