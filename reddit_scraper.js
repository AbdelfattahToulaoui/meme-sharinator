request = require('request');

const {downloadVideo, downloadImage} = require('./downloader.js');

function getTopSubreddit(sub, t='day'){
    return new Promise( (resolve, reject) => {
        var rq = request.get(`https://www.reddit.com/r/${sub}/top.json?t=${t}&limit=1`, (error, response, body) => {
            if (response.statusCode !== 200) {
                console.info('Error');
                reject('Connection error');
            }else{
                var data = JSON.parse(body);
                var children = data.data.children;
                if(!children){
                    reject(`Subreddit doesn\'t exist, or other error\nIDK and I don't care`);
                    return;
                }else if(children[0].kind == 't3'){
                    var post = data.data.children[0].data;
                    var val = {
                        'type': 'posts',
                        'title': post.title,
                        'body': post.selftext,
                        'ups': post.ups,
                        'downs': post.downs,
                        'spoiler': post.spoiler,
                        'nsfw': post.thumbnail == 'nsfw',
                        'subscribers': post.subreddit_subscribers,
                        'sub': post.subreddit_name_prefixed,
                        'media': undefined
                    }
                    if(post.is_video){
                        var media = post.media.reddit_video.hls_url || post.media.reddit_video.dash_url;
                        val.media = downloadVideo(media);
                    }else if(post.post_hint == 'image'){
                        val.media = downloadImage(post.url);
                    }else if(post.post_hint){
                        val.body += post.url;
                    }

                    if(val.media){
                        val.media.then((res) =>{
                            val.media = res;
                            resolve(val);
                        });
                    }else{
                        resolve(val);
                    }
                }else if(children[0].kind == 't5'){
                    resolve({
                        type: 'reddits'
                    });
                }
            }
        });
    });
}


async function getTopSubreddits(subs, t='day'){
    return new Promise((resolve) => {
        if(subs.length == 0)
            resolve(null);
        var i = subs.length;
        var url = null;
        var ratio = 0;
        subs.forEach(
            (sub) => {
                var rq = request.get(`https://www.reddit.com/r/${sub}/top.json?t=${t}&limit=1`, (error, response, body) => {
                    i--;
                    if (response.statusCode !== 200) {
                        console.info('Error');
                        reject('Connection error');
                    }else{
                        var data = JSON.parse(body);
                        var children = data.data.children;
                        if(!children){
                            reject(`Subreddit doesn\'t exist, or other error\nIDK and I don't care`);
                            return;
                        }else if(children[0].kind == 't3'){
                            var r = children[0].ups /  children[0].subreddit_subscribers;
                            if(!url || r > ratio){
                                ratio = r;
                                url = sub;
                            }
                        }
                    }
                    if(i==0){
                        getTopSubreddit(url, t).then( (post) => {
                            resolve(post);
                        });
                    }
                }
            );
        });
    });
}


module.exports = {
    'getTopSubreddit': getTopSubreddit,
    'getTopSubreddits': getTopSubreddits
};

