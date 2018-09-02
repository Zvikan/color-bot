FROM mhart/alpine-node

# Install app dependencies
COPY package*.json ./
RUN npm install
# Bundle app source
COPY . .
VOLUME /db_slack_bot_ci
CMD [ "npm", "start" ]