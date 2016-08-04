#!/usr/bin/env node

'use strict';

const fs = require('fs');
const _ = require('lodash');
const Promise = require('bluebird');
const yargs = require('yargs');

const RippleUtils = require('./index');

const args = process.argv.join(' ');

const argv = yargs(args)
  .usage('Usage: $0 [options]')
  .describe('address', 'ripple address')
  .string('address')
  .describe('secret', 'ripple secret')
  .string('secret')
  .implies('secret', 'address')
  .describe('generate', 'generate wallet')
  .boolean('generate')
  .describe('sequence', 'transaction sequence')
  .number('sequence')
  .describe('get-sequence', 'get wallet sequence')
  .boolean('get-sequence')
  .group(['address', 'secret', 'generate'], 'Options:')
  .describe('flags', 'sets flag')
  .choices('flags', ['defaultRipple', 'disallowIncomingXRP', 'requireDestinationTag'])
  .array('flags')
  .string('flags')
  .describe('trust', 'sets trustline (currency=XRP,counterparty=asgd,limit=10000)')
  .string('trust')
  .describe('fee', 'sets fee')
  .number('fee')
  .describe('publish', 'submit or load transactions')
  .boolean('publish')
  .describe('save', 'saves transactions to file')
  .string('save')
  .group(['flags', 'trust', 'fee', 'publish', 'save'], 'Wallet:')
  .describe('fund', 'fund wallet')
  .boolean('fund')
  .describe('funding-address', 'funding ripple address')
  .string('funding-address')
  .describe('funding-secret', 'funding ripple secret')
  .string('funding-secret')
  .implies('fund', 'funding-address')
  .implies('fund', 'funding-secret')
  .group(['fund', 'funding-address', 'funding-secret'], 'Funding:')
  .help('h').alias('h', 'help')
  .strict()
  .argv;

Promise.try(() => {
  const rippleUtils = new RippleUtils();
  let tasks = Promise.resolve();

  let wallet;
  if (argv.generate) {
    wallet = rippleUtils.generateWallet();
    console.log(`wallet generated`)
    console.log(`address: ${wallet.address}`);
    console.log(`secret: ${wallet.secret}`);
  } else if (argv.address && argv.secret) {
    wallet = rippleUtils.importWallet(argv.address, argv.secret)
    console.log(`wallet imported cold:${wallet.address},hot:${wallet.secret}`)
  }

  if (argv.getSequence) {
    tasks = rippleUtils.getSequence().then(seq => console.log(`sequence ${seq}`));
  } else {
    if (argv.fund) {
      console.log('wallet will be funded');
      tasks = rippleUtils.fund({address: argv.fundingAddress, secret: argv.fundingSecret}
      ).tap(() => console.log('wallet funded'));
    }

    if (!wallet) {
      console.error('Wallet not provided');
      process.exit(1);
    }

    if (argv.sequence) {
      console.log(`wallet transactions sequence set to ${argv.sequence}`)
      wallet.setSequence(argv.sequence);
    }

    if (argv.flags) {
      console.log(`setting wallet flags ${argv.flags}`)
      wallet.setOptions(_.zipObject(argv.flags, true));
    }

    if (argv.fee) {
      console.log(`setting wallet fee to ${argv.fee}`)
      wallet.setOption('transferRate', argv.fee);
    }

    if (argv.trust) {
      console.log(`setting wallet trust to ${argv.trust}`);
      const options = _.fromPairs(
        _.map(_.split(argv.trust, ','), pair => _.split(pair, '='))
      );
      wallet.setTrustline(options);
    }

    if (argv.save) {
      tasks = tasks
        .tap(() => console.log('getting transactions'))
        .then(() => wallet.getTransactions())
        .tap(() => console.log(`writing transactions to file ${argv.save}`))
        .then(transactions => {
          const content = {
            sequence: wallet.sequence,
            address: wallet.address,
            secret: wallet.secret,
            transactions: transactions
          };
          fs.writeFileSync(argv.save, JSON.stringify(content));
        });
    }

    if (argv.publish) {
      tasks = tasks
        .tap(() => console.log('getting transactions'))
        .then(() => wallet.getTransactions())
        .tap(() => console.log('submiting transactions'))
        .then(transactions => rippleUtils.publish(transactions))
        .tap(() => console.log('transactions submitted'));
    }
  }

  return tasks;
}).then(() => process.exit(0));
