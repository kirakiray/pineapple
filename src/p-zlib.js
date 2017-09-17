const zlib = require('zlib');

//pzlib模块，符合promise哲学的zlib模块
var gzip = input => new Promise((res, rej) => {
    zlib.gzip(input, (err, buffer) => {
        if (err) {
            res(0);
            console.error(err);
        } else {
            res(buffer);
        }
    });
});

exports.gzip = gzip;