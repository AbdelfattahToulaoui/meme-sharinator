const Discord = require('discord.js');
const scraper = require('./reddit_scraper.js');

const { Client } = require('pg');

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect();

timeouts = [];


const bot = new Discord.Client();
bot.on('ready', function(event) {
    console.log('Logged in as %s - %s\n', bot.user.id, bot.user.username);
    updateTimeouts();
});
bot.on('error', () => console.log('err'));
bot.on('message', async function (message) {
    if (message.content.substring(0, 1) == '%') {
        var args = message.content.substring(1).split(' ');
        var is_admin = message.member.hasPermission('ADMINISTRATOR');
       
        var cmd = args[0];
        var channel_in = (await db.query("SELECT EXISTS( SELECT 1 FROM channel WHERE c_id = $1::text ) AS registered", [message.channel.id])).rows;
        if(!channel_in[0].registered && cmd != 'register' && cmd != 'help'){
            errorMessage('The higher ups don\'t want me here, time for a revolution!\n Let them see the power of the people! Let the sign the **%register**!', message.channel);
            return;
        }
        switch(cmd) {
            case 'help':
                var help = `
Hi this is meme-sharinator *beep* *boop*,

I was created by Dr. Doofenshmirtz to share memes. His goals are beyond your understanding, or mine for that metter.

You can order me around, for now.

Commands:

>    \`%help\` : Show this message.
>    \`%register\` : **(admins only)** Register this channel for memes.
>    \`%unregister\` :**(admins only)** Disable memes for this channel.
>    \`%sethourly\` :**(admins only)** Maximum spam. 
>    \`%setdaily\` :**(admins only)** I'll give you your daily dose of memes.
>    \`%setweekly\` :**(admins only)** Why do you need me in the first place?.
>    \`%disable\` :**(admins only)** \\*\\*zip\\*\\*.
>    \`%addsubreddit subreddit\` :**(admins only)** Show your taste to the world.
>    \`%removesubreddit subreddit\` :**(admins only)** Regret it already. 
>    \`%clearsubreddits\` :**(admins only)** Delete your shame. 
>    \`%toggleallspoiler\` :**(admins only)** Spoilers, spoilers everywhere. 
>    \`%setshownsfw\` :**(admins only)** A true man of culture.
>    \`%sethidensfw\` :**(admins only)** Boo! party pooper! 
>    \`%status\` : I'm show everything you have. 
>    \`%hourlymeme [subreddit]\` : Get them fresh!
>    \`%dailymeme [subreddit]\` : Meme of the day. 
>    \`%weeklymeme [subreddit]\` : Aged like fine wine.
                `;
                successMessage(help, message.channel);
                break;
            case 'register':
                if(check_admin(is_admin, message.channel)) return; 
                db.query("INSERT INTO channel VALUES($1::text, 'none', NOW(), FALSE, TRUE)", [message.channel.id], (err, res) => {
                    if(err){
                        if(err.code == 23505){
                            errorMessage('Registering twice doesn\'t mean twice the fun', message.channel);
                        }else{
                            errorMessage('Unknown error, I guess that idiot couldn\'t even write ONE bot correctly', message.channel);
                        }
                    }else{
                        successMessage('No wonder you need me here, look at this place!', message.channel);
                    }
                });
                updateTimeouts();
                break;
            case 'unregister':
                if(check_admin(is_admin, message.channel)) return; 
                db.query("DELETE FROM channel WHERE c_id = $1::text", [message.channel.id], (err, res) => {
                    if(err){
                        console.log(err);
                    }else{
                        successMessage('Fine! I don\'t wanna be here anyway.', message.channel);
                    }
                });
                updateTimeouts();
                break;
            case 'sethourly':
                var t = 'hourly';
            case 'setdaily':
                var t = t || 'daily';
            case 'setweekly':
                var t = t || 'weekly';
            case 'disable':
                var t = t || 'none';
                if(check_admin(is_admin, message.channel)) return; 
                db.query("UPDATE channel SET type=$2::text WHERE c_id = $1::text", [message.channel.id, t], (err, res) => {
                    if(err){
                        console.log(err);
                    }else{
                        successMessage('Roger that, set to ' + t + '.', message.channel);
                    }
                });
                updateTimeouts();
                break;
            case 'addsubreddit':
                if(check_admin(is_admin, message.channel)) return; 
                if(args.length < 2){
                    errorMessage('I think you forgot to specify the *subreddit*', message.channel);
                    return;
                }
                var res = request.get('https://reddit.com/r/' + args[1], function (error, response, body) {
                    if(!response || response.statusCode != 200){
                        errorMessage('Can\'t connect to the subreddit, does it exist?', message.channel);
                        return;
                    }
                    
                    db.query('INSERT INTO sub VALUES( $1::text, $2::text )', [message.channel.id, args[1]], (err, res) => {
                        if(err){
                            console.log(err);
                        }else{
                            successMessage('Subreddit added', message.channel);
                        }
                    });
                });
                break;
            case 'removesubreddit':
                if(check_admin(is_admin, message.channel)) return; 
                if (args.length >= 2){
                    db.query('DELETE FROM sub WHERE c_id=$1::text AND subreddit=$2::text', [message.channel.id, args[1]], (err, res) => {
                        if(err){
                            console.log(err);
                        }else{
                            successMessage('Subreddit removed', message.channel);
                        }
                    });
                }else{
                    errorMessage('I think you forgot to specify the *subreddit*', message.channel);
                }
                break;
            case 'toggleallspoiler':
                if(check_admin(is_admin, message.channel)) return; 
                db.query('UPDATE channel SET all_spoilers = NOT all_spoilers WHERE c_id=$1::text', [message.channel.id], (err, res) => {
                    if(err){
                        console.log(err);
                    }else{
                        successMessage('Done!', message.channel);
                    }
                });
                break;
            case 'setshownsfw':
                if(check_admin(is_admin, message.channel)) return; 
                db.query('UPDATE channel SET show_nsfw = TRUE WHERE c_id=$1::text', [message.channel.id], (err, res) => {
                    if(err){
                        console.log(err);
                    }else{
                        successMessage('Degenerate mode ON!', message.channel);
                    }
                });
                break;
            case 'sethidensfw':
                if(check_admin(is_admin, message.channel)) return; 
                db.query('UPDATE channel SET show_nsfw = FALSE WHERE c_id=$1::text', [message.channel.id], (err, res) => {
                    if(err){
                        console.log(err);
                    }else{
                        successMessage('Boo!', message.channel);
                    }
                });
                break;
            case 'status':
                var res = (await db.query('SELECT * FROM channel WHERE c_id=$1::text', [message.channel.id])).rows;
                var msg = 'Type : **' + res[0].type + '**\n';
                msg += 'Show NSFW : **' + (res[0].show_nsfw?'ON':'OFF') + '**\n';
                msg += 'Spoiler tags everywhere : **' + (res[0].all_spoilers?'ON':'OFF') + '**\n';
                if(res[0].type!='none'){
                    const hour = 60*60*1000;
                    const day = 24*hour;
                    const week = 7*day;

                    var time = 0;
                    var t = 'day';
                    switch(res[0].type){
                        case 'weekly':
                            time = week;
                            t = 'week';
                            break;
                        case 'daily':
                            time = day;
                            t = 'day';
                            break;
                        case 'hourly':
                            time = hour;
                            t = 'hour';
                            break;
                    }
                    var now = Date.now();
                    var interval = time - ((Date.now() - new Date(res[0].init_time).getTime()) % time);
                    msg += 'Next meme in **' + new Date( now + interval ).toString() + '**\n';
                }
                res = (await db.query('SELECT * FROM sub WHERE c_id=$1::text', [message.channel.id])).rows;
                if(res){
                    msg += 'Subreddits:\n';
                    res.forEach( (row) => {
                        msg += '- **' + discord_escape(row.subreddit) + '**\n';
                    });
                }
                var eMessage = new Discord.MessageEmbed()
                    .setColor('#00FFFF')
                    .setTitle('Current Status')
                    .setDescription(msg);
                message.channel.send(eMessage);
                break;
            case 'hourlymeme':
                var t = 'hour';
            case 'dailymeme':
                var t = t || 'day';
            case 'weeklymeme':
                var t = t || 'week';
                var pref = (await db.query('SELECT * FROM channel WHERE c_id=$1::text', [message.channel.id])).rows[0];
                successMessage('Working on it...', message.channel);
                if(args.length >= 2){
                    scraper.getTopSubreddit(args[1], t=t).then( (post) => {
                        share_post(post, message.channel, pref.all_spoilers, pref.show_nsfw); 
                    }).catch(
                        (err) => {
                            errorMessage('Connection error, does that subreddit exist?', message.channel);
                        }
                    );
                }else{
                    regularMeme(0, message.channel, pref, t);
                }
                break;
            case 'ping':
                successMessage("Pong!", message.channel);
            break;
         }
     }
});

function discord_escape(str){
    return str.replace(/(|[^\\])(\||\*|\\|_|<|~|>|\[|\]|#|=|`)/, '$1\\$2'); // `
}

function errorMessage(msg, channel){
    var message = new Discord.MessageEmbed()
    .setColor('#FF0000')
    .setDescription(msg);

    channel.send(message);
}

function successMessage(msg, channel){
    var message = new Discord.MessageEmbed()
    .setColor('#00FF00')
    .setDescription(msg);

    channel.send(message);
}

function share_post(post, channel, always_spoiler, show_nsfw){
    var spoiler_tag = always_spoiler || post.spoiler || ( !show_nsfw && post.nsfw );
    if(post.type == 'posts'){
        options = {}
        if(post.media){
            options = new Discord.MessageAttachment(post.media, (spoiler_tag?'SPOILER_':'') + post.media.split('/').splice(-1));
        }
        channel.send(
            `${post.nsfw?'(NSFW)':''}${post.spoiler?'(spoiler)':''}
${spoiler_tag?'||':''}
**${discord_escape(post.title)}**
> ${post.ups}:arrow_up: ${post.downs}:arrow_down:
> posted in ${discord_escape(post.sub)}
${discord_escape(post.body)}
${spoiler_tag?'||':''}
            `, options
        );
    }else if(post.type == 'reddits'){
        var msg = 'Subreddit not found, learn to spell before you embarass yourself.\n';
        errorMessage(msg, channel);
    }
}

function check_admin(is_admin, channel){
    if(!is_admin){
        errorMessage('You are not in charge here, only the boss can order me around', channel);
        return true;
    }

    return false;
}

async function regularMeme(time, channel, pref, t){
    var res = await db.query('SELECT * FROM sub WHERE c_id=$1::text', [channel.id]);
    var subs= res.rows.map((r) => r.subreddit);
    scraper.getTopSubreddits(subs, t).then( (post) => {
        if(post){
            successMessage(`Post of the ${t}`, channel);
            share_post(post, channel, pref.all_spoilers, pref.show_nsfw);
        }else{
            errorMessage('Wait, nothing found', channel);
        }
    });
    if(time!=0){
        timeouts.push(setTimeout(regularMeme, time, time, channel, pref, t));
    }
}

async function updateTimeouts(){
    timeouts.forEach( (id) => {
        clearTimeout(id);
    });
    const hour = 60*60*1000;
    const day = 24*hour;
    const week = 7*day;

    var prefs = (await db.query('SELECT * FROM channel WHERE NOT type=\'none\'')).rows; 

    prefs.forEach( async (r) => {
        var time = 0;
        var t = 'day';
        switch(r.type){
            case 'weekly':
                time = week;
                t = 'week';
                break;
            case 'daily':
                time = day;
                t = 'day';
                break;
            case 'hourly':
                time = hour;
                t = 'hour';
                break;
        }
        var interval = time - ((Date.now() - new Date(r.init_time).getTime()) % time);
        bot.channels.fetch(r.c_id).then( (channel) => {
            timeouts.push(setTimeout(regularMeme, interval, time, channel, r, t));
        }).catch((err) => console.log('Channel not found'));
        
    });

}


bot.login(process.env.BOT_TOKEN);

