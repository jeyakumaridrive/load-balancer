const redis = require('redis');

const publisher = redis.createClient();

publisher.publish('my channel', 'hi');

publisher.publish('my channel', 'hello world');