var fs = require('fs');

//pfs模块，方便async await哲学的fs模块

//读取目录
var readdir = (path, option) => new Promise((res, rej) => {
    fs.readdir(path, option, (err, files) => {
        if (err) {
            if (err.errno == -20) {
                //非目录
                res(0);
            } else if (err.errno == -2) {
                //找不到路径
                res(null);
            } else {
                console.error(err);
                res();
            }
        } else {
            res(files);
        }
    });
});

//制作目录
var mkdir = (path, mode) => new Promise((res, rej) => {
    fs.mkdir(path, mode, (err, data) => {
        if (err) {
            //建立失败
            res(0);
        } else {
            //建立成功
            res(1);
        }
    });
});

//读取文件
var readFile = (path, option) => new Promise((res, rej) => {
    fs.readFile(path, option, (err, data) => {
        if (err) {
            if (err.errno == -21) {
                //非文件
                res(0);
            } else if (err.errno == -2) {
                //找不到路径
                res(null);
            } else {
                console.error(err);
                res();
            }
        } else {
            res(data);
        }
    });
});

//写入文件
var writeFile = (file, data, options) => new Promise((res, rej) => {
    fs.writeFile(file, data, options, (err) => {
        if (err) {
            res(0);
        } else {
            res(1);
        }
    });
});

//查看状态
var stat = path => new Promise((res, rej) => {
    fs.stat(path, (err, data) => {
        if (err) {
            if (err.errno == -2) {
                //找不到路径
                res(null);
            } else {
                console.error(err);
                res();
            }
        } else {
            res(data);
        }
    });
});

//重命名
var rename = (oldPath, newPath) => new Promise((res, rej) => {
    fs.rename(oldPath, newPath, (err, d) => {
        if (err) {
            res(0);
        } else {
            res(1);
        }
    });
});

//文件尾部添加东西
var appendFile = (file, data, options) => new Promise((res, rej) => {
    fs.appendFile(file, data, options, (err) => {
        if (err) {
            console.error(err);
            res(0);
        } else {
            res(1);
        }
    });
});

//采用流的方式复制文件，大文件也不用怕
var copy = (oldPath, newPath) => {
    //进度函数
    var progressFun;

    //进度长度
    var passedLength = 0;
    var totalLength;

    //返回的Promise
    var p = new Promise((res, rej) => {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('data', (chunk) => {
            //流长度叠加
            passedLength += chunk.length;

            totalLength && progressFun && progressFun(passedLength, totalLength);

            // 当有数据流出时，写入数据
            if (writeStream.write(chunk) === false) {
                // 如果没有写完，暂停读取流
                readStream.pause();
            }
        });

        writeStream.on('drain', () => {
            // 写完后，继续读取
            readStream.resume();
        });

        readStream.on('end', () => {
            // 当没有数据时，关闭数据流
            writeStream.end();
            res(1);
        });
    });

    //设置流程函数
    p.progress = (fun) => {
        progressFun = fun;
        stat(oldPath).then((statdata) => {
            totalLength = statdata.size;
        });
        return p;
    };

    // p.then(() => {
    //     //清空
    //     p = p.progress = progressFun = null;
    // })

    return p;
};

//挂载
exports.readdir = readdir;
exports.mkdir = mkdir;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.stat = stat;
exports.rename = rename;
exports.appendFile = appendFile;
exports.copy = copy;