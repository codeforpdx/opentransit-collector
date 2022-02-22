FROM node:16.14.0

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Bundle app source
COPY . .

CMD [ "npm", "run", "start" ]

# Build
# docker build -t opentransit-collector .

# Run
# docker run opentransit-collector:latest
