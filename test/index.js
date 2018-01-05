const program = require('commander')
const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)

program
  .version('0.1.0')
  .option('-f --function [function]', 'function invocation to test (eval\'d)')
  .parse(process.argv)

if (program.function) {
  const fn = `cliniko.${program.function}`
  console.log(`Running function invocation ${fn} ...`)
  try {
    eval(fn)
      .then(console.log)
      .catch(console.error)
  } catch(e) {
    console.error(e)
  }
}
