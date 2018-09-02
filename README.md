# Color-bot
![Alt text](https://is2-ssl.mzstatic.com/image/thumb/Purple122/v4/55/ee/e8/55eee880-f147-1c59-b619-3d06f697a6c8/source/512x512bb.jpg)

## What is this?
Slack bot for color environemnt assignment by JIRA tickets.

## How to use ?

1. Go to https://my.slack.com/apps/new/A0F7YS25R-bots and pick a name for your new bot.
(make sure you are in the right workspace)
2. Once you’ve clicked “Add integration,” you’ll be taken to a page where you can further customize your bot. Of importance is the bot token—take note of it now.
3. Once you have the token, create a `.env` file and inside put your token:

    ```bash
    TOKEN=xoxb-your-token-here 
    ```

4. Make sure to set the other `.env`  variables:  

    ```bash
    JIRA_USERNAME=jira-username-here
    JIRA_PASSWORD=jira-password-here
    JIRA_HOST=jira-host-here
    JIRA_PORT=jira-port-here
    JIRA_HOST_PROTOCOL=jira-host-protocol-here
    ```
5. Execute:
     ```bash
    npm install 
    ```
6. Execute:
    ```bash
    npm start
    ```
7. Invite the bot to one of the channels and start communicate with it.

## Communicating with color-bot
Used with simple wildcard regex:
Mention the bot (e.g. `@color-bot`) and then type one of the following:
- assigning a new color with jira ticket:
```bash
use (.*) ticket (.*) 
```
```bash
color (.*) ticket (.*)
```
```bash
use (.*) jira (.*)
```
```bash
color (.*) jira (.*)
```  

![Alt text](screenshots/sample.png)  
<br/>
<br/>
- releasing color env (must be made by the owner of the first assignment):
```bash
release (.*)
```
```bash
free (.*)
```
```bash
done (.*)
```

## Using Docker
If you wish to use docker, simply run the following commands from within the repo folder:

1. Build
    ```bash
    docker build -t color-bot .
    ```
2. Run
    ```bash
    docker run -v PATH-TO-REPO-FOLDER/db_slack_bot_ci:/db_slack_bot_ci color-base
    ```

## TODO LIST
- use mongo instead of volume filesystem
- cron jobs for JIRA to check every day if holding person is still working on that ticket by private convo from bot to user
- cron jobs to check every other min status of the holding JIRA tickets and automatically free relevant color envs if JIRA ticket status is DONE/FINISHED/RESOLVED etc..
- add more cool features that may be useful :)