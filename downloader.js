const util = require('./util.js');
const {join} = require('path');
const shell = require('any-shell-escape');
const {exec} = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const request = require('request');
const fs = require('fs');

function downloadImage(url){
    return new Promise( (resolve, reject) =>{
        var outfile = url.split('/');
        outfile = outfile[outfile.length-1].split('?')[0];
        outfile = join('/tmp/', outfile);
        const file = fs.createWriteStream(outfile);
        const sendReq = request.get(url);
        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                reject('Request error');
            }else{
                sendReq.pipe(file);
            }

            file.on('finish', () => {
                file.close();
                resolve(outfile);
            });

            sendReq.on('error', (err) => {
                reject('Request error');
            });

            file.on('error', (err) => {
                reject('File Error');
            });
        });
    });
}


function downloadVideo(url, ext='mp4', vcodec='copy', acodec='copy'){
    return new Promise( (resolve, reject) => {
        var outfile = join('/tmp/', util.randomHex() + '.' + ext);
        var scr = shell(
            [
                ffmpegPath, '-y', '-i', url, '-c:v', vcodec, '-c:a', acodec,
                outfile
            ]
        );
        exec(scr, (err) => {
            if (err) {
                reject('ffmpeg error: ' + scr);
            } else {
                resolve(outfile);
            }
        });
    });
}


module.exports = {'downloadVideo': downloadVideo, 'downloadImage': downloadImage};

