/* eslint no-console: 0 */

const autocannon = require('autocannon');
const kleur = require('kleur');
const fs = require('fs');
const minimist = require('minimist');
const ora = require('ora');
const nap = require('pancho');
const Table = require('cli-table');
const { fork } = require('child_process');

const files = fs
  .readdirSync(`${__dirname}/cases`)
  .filter((file) => file.match(/(.+)\.js$/));

const argv = minimist(process.argv.slice(2));
const cannon = (title = null) =>
  new Promise((yes, no) => {
    autocannon(
      Object.assign(
        {},
        {
          url: argv.u || 'http://localhost:3001/user/keys/233',
          connections: argv.c || 500,
          pipelining: argv.p || 50,
          duration: argv.d || 10
        },
        { title }
      ),
      (error, result) => (error ? no(error) : yes(result))
    );
  });

let index = 0;
const benchmark = async (results) => {
  results.push(
    await new Promise(async (yes, no) => {
      const file = files[index];
      if (argv.o && argv.o !== file) {
        return yes();
      }

      const forked = fork(`${__dirname}/cases/${file}`);
      await nap(0.25);

      try {
        const framework = kleur.blue(file.replace('.js', ''));
        const spin = ora(`Warming up ${framework}`).start();
        spin.color = 'yellow';
        await cannon();
        spin.text = `Running ${framework}`;
        spin.color = 'green';
        const result = await cannon(file);
        spin.text = framework;
        spin.succeed();
        forked.kill('SIGINT');
        await nap(0.25);
        return yes(result);
      } catch (error) {
        return no(error);
      }
    })
  );

  index += 1;
  if (index < files.length) {
    return benchmark(results);
  }

  return results.sort((a, b) => {
    if (b.requests.average < a.requests.average) {
      return -1;
    }

    return b.requests.average > a.requests.average ? 1 : 0;
  });
};

benchmark([]).then((results) => {
  const table = new Table({
    head: ['', 'Requests/s', 'Latency', 'Throughput/Mb']
  });

  results.forEach((result) => {
    if (result) {
      table.push([
        kleur.blue(result.title.replace('.js', '')),
        result.requests.average,
        result.latency.average,
        (result.throughput.average / 1024 / 1024).toFixed(2)
      ]);
    }
  });

  console.log(table.toString());
});
