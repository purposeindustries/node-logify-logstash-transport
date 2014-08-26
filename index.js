var Logstash = require('logstash-client');
var format = require('util').format;
var merge = require('merge-object');
var flatten = require('flat').flatten;
function LogstashTransport(opts) {
  opts = opts || {};

  this.port = opts.port || 12201;
  this.host = opts.host || 'localhost';

  this.client = new Logstash({
    type: opts.type||'tcp',
    host: this.host,
    port: this.port
  });
}

LogstashTransport.prototype.log = function log(message) {
  var msg = {
    'message': format.apply(null, [message.msg].concat(message.args)),
    '@timestamp': message.date.toISOString(),
    tags: message.tags,
    source: message.source || [
      message.context.host,
      message.context.appName
    ].join('/'),
    level: message.level.name
  };
  Object.keys(msg).forEach(function(key) {
    delete message[key];
  });
  var context = message.context;
  delete message.context;
  var flatContext = flatten(context);
  var flatMessage = flatten(message);
  var fullMessage = merge(flatContext, flatMessage);
  this.client.send(merge(msg, fullMessage));
};

module.exports = function create(opts) {
  return new LogstashTransport(opts);
};

module.exports.LogstashTransport = LogstashTransport;