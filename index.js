/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */
require('dotenv').config();

let JIRA_URL = process.env.JIRA_HOST_PROTOCOL + '://' + process.env.JIRA_HOST + ':' + process.env.JIRA_PORT + '/browse/';
let JiraClient = require('jira-connector');

let jira = new JiraClient({
    host: process.env.JIRA_HOST,
    basic_auth: {
        username: process.env.JIRA_USERNAME,
        password: process.env.JIRA_PASSWORD
    },
    protocol: process.env.JIRA_HOST_PROTOCOL,
    port: process.env.JIRA_PORT
});


// jira.issue.getIssue({
//     issueKey: 'DEVOPS-600'
// }, function(error, issue) {
//     console.log(issue.fields.status());
// });


function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */
let config = {};
if (process.env.MONGOLAB_URI) {
    let BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/'), //use a different name if an app or CI
    };
}

let controller;
/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    let customIntegration = require('./lib/custom_integrations');
    let token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    let app = require('./lib/apps');
    controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}


/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears(['hello', 'hi', 'greetings'], ['direct_mention', 'mention', 'direct_message'], function (bot, message) {
    bot.reply(message, 'Hello!');
});


/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
controller.on('direct_message,mention,direct_mention', function (bot, message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'heart',
    }, function (err) {
        if (err) {
            console.log(err)
        }
        // bot.reply(message, 'I heard you loud and clear boss.');
    });
});

controller.hears(['use (.*) ticket (.*)', 'color (.*) ticket (.*)', 'use (.*) jira (.*)', 'color (.*) jira (.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
    let color = message.match[1].toLowerCase();
    let ticket = message.match[2];
    let userData = {isFree: false, ticket_num: ticket, slack_user_id: message.user};
    if (color === 'red' || color === 'blue' || color === 'stress' || color === 'orange' || color === 'green') {
        controller.storage.users.get(color, function (err, _color) {
            let colorData;
            if (!_color || _color.name.isFree) {
                colorData = {
                    id: color,
                    name: userData

                };
                controller.storage.users.save(colorData);
                bot.reply(message, 'Thank you <@' + message.user + '>, ' + 'You have been assigned for `' + color.toUpperCase() + '` with the ticket <' + JIRA_URL + ticket + '|' + ticket + '> ');
            } else {
                bot.reply(message, 'Sorry <@' + message.user + '>, but `' + color.toUpperCase() + '` is currently being used by <@' + _color.name.slack_user_id + '>  Ticket:' +
                    '<' + JIRA_URL + _color.name.ticket_num + '|' + _color.name.ticket_num + '>')
            }
        });
    } else {
        bot.reply(message, 'Sorry <@' + message.user + '>, but the color you\'ve selected (`' + color.toUpperCase() + '`) is invalid. \n You may choose between ' +
            'Red/Blue/Green/Orange/Stress');
    }
});


controller.hears(['release (.*)', 'free (.*)', 'done (.*)'], 'direct_message,direct_mention,mention', function (bot, message) {
    let color = message.match[1].toLowerCase();
    if (color === 'red' || color === 'blue' || color === 'stress' || color === 'orange' || color === 'green') {
        controller.storage.users.get(color, function (err, _color) {
            if (!_color || _color.name.isFree === true) {
                bot.reply(message, 'Psss....<@' + message.user + '>, the color `' + color.toUpperCase() + '` is already freed.');
            } else {
                if (message.user === _color.name.slack_user_id) {
                    _color.name.isFree = true;
                    controller.storage.users.save(_color);
                    bot.reply(message, 'Thank you <@' + message.user + '>, `' + color.toUpperCase() + '` has been freed and it\'s now available to anyone');
                } else {
                    bot.reply(message, 'Sorry <@' + message.user + '>, but `' + color.toUpperCase() + '` is currently being used by <@' + _color.name.slack_user_id + '>  Ticket:' +
                        '<' + JIRA_URL + _color.name.ticket_num + '|' + _color.name.ticket_num + '> and only <@' + _color.name.slack_user_id + '>' +
                        'can release/free it');
                }
            }
        });
    } else {
        bot.reply(message, 'Sorry <@' + message.user + '>, but the color you\'ve selected (`' + color.toUpperCase() + '`) is invalid. \n You may choose between ' +
            'Red/Blue/Green/Orange/Stress');
    }
});

