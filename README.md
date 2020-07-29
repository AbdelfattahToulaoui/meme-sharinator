# meme-sharinator

A Discord bot to scrape memes off of reddit.

## Installing and running

* You need to have Node.js and npm installed on your system.

    Run `npm install` to install the required packages.


* This bot requires two environment variables to work:
    * The `BOT_TOKEN` variable which contains your discord bot token.
    * The `DATABASE_URL` variable which contains a valid PostgreSQL database URL.

After that, run `node bot.js` and your bot should be up and running.

## Using the bot

The `%register` command will enable users to interact with the bot in the current channel, while `%unregister` removes that ability.

Use the `%help` command to get the available commands for the bot.

## License

This project is licensed under the GPLv3 License - see the [LICENSE.md](LICENSE.md) file for details

