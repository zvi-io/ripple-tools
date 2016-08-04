'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const RippleAPI = require('ripple-lib').RippleAPI;


class RippleUtils {
  constructor(options) {
    this.options = _.defaultsDeep(options, {
      ripple: {server: 'wss://ripple.gatehub.net'}
    });

    this.ripple = new RippleAPI(this.options.ripple);
    this.connection = this.ripple.connect();

    this.sequence = 1;
    this.txs = [];
  }

  get address() {
    return this.wallet.address;
  }

  get secret() {
    return this.wallet.secret;
  }

  _nextTx(tx) {
    this.sequence ++;
    this.txs.push(tx);
    return this;
  }

  setSequence(seq) {
    return this.sequence = seq;
  }

  getSequence(seq) {
    return this.connection.then(() => {
      return this.ripple.getAccountInfo(this.address).then(info => info.sequence);
    });
  }

  setWallet(address, secret) {
    this.wallet = {address: address, secret: secret};
  }

  setOption(name, value) {
    let sequence = this.sequence;
    this._nextTx(this.connection.then(() => {
      return this.ripple.prepareSettings(
        this.address,
        {[name]: value},
        {sequence: sequence}
      );
    }));

    return this;
  }

  setOptions(options) {
    _.forEach(options, (value, key) => this.setOption(key, value));

    return this;
  }

  setTrustline(options) {
    let sequence = this.sequence;
    this._nextTx(this.connection.then(() => {
      return this.ripple.prepareTrustline(
        this.address,
        options,
        {sequence: sequence}
      );
    }));

    return this;
  }

  fund(options) {
    options = _.defaults(options, {
      address: null,
      secret: null,
      amount: 50
    });

    if (!this.address) {
      throw new Error('wallet address not provided');
    }

    const payment = {
      source: {
        address: options.address,
        maxAmount: {
          value: (options.amount.toString() * 1.006).toString(),
          currency: 'XRP'
        }
      },
      destination: {
        address: this.address,
        amount: {
          value: options.amount.toString(),
          currency: 'XRP'
        }
      }
    };

    return Promise.resolve(this.connection)
      .then(() => this.ripple.getAccountInfo(this.address)).catch(err => {
        if (err.message !== 'actNotFound') {
          throw err;
        }

        return this.ripple.preparePayment(options.address, payment).then(tx => {
          _.extend(tx, this.ripple.sign(tx.txJSON, options.secret));
          return this.publish(tx);
        });
      });
  }

  getTransactions() {
    return Promise.map(this.txs, tx => {
      return _.extend(tx, this.ripple.sign(tx.txJSON, this.secret));
    });
  }

  publish(transaction) {
    if (_.isArray(transaction)) {
      return Promise.map(transaction, tx => this.publish(tx));
    }

    return this.connection.then(() => {
      if (options.retry) {
      }
      return Promise.all([
        this.ripple.submit(transaction.signedTransaction),
        this.ripple.getLedgerVersion()
      ]).spread((result, version) => {
        if (
          result.resultCode !== 'tesSUCCESS' &&
          result.resultCode !== 'terQUEUED'
        ) {
          throw new Error('problem submiting transaction: ' + result.resultCode);
        }

        const waitSubmitted = () => {
          return this.ripple.getTransaction(
            transaction.id,
            {
              minLedgerVersion: version,
              maxLedgerVersion: version + transaction.instructions.maxLedgerVersion
            }
          ).then(tx => {
            if (tx.outcome.result !== 'tesSUCCESS') {
              throw new Error('problem submitting transaction');
            }
          }).catch(err => {
            if (
              err instanceof this.ripple.errors.MissingLedgerHistoryError ||
              err instanceof this.ripple.errors.PendingLedgerVersionError
            ) {
              return Promise.delay(1000).then(() => waitSubmitted());
            } else if (err instanceof this.ripple.errors.NotFoundError) {
              throw new Error('problem processing transaction' + err);
            } else {
              debugger
              throw new Error('connection error');
            }
          });
        }

        return waitSubmitted();
      });
    });
  }

  generateWallet() {
    this.wallet = this.ripple.generateAddress();
    return this;
  }

  importWallet(address, secret) {
    this.wallet = {address: address, secret: secret};
    return this;
  }
}

module.exports = RippleUtils;
