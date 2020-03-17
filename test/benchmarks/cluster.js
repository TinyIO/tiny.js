const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

module.exports = (create) => {
  if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on('exit', () => {
      process.exit(1);
    });
  } else {
    create();
  }
};
