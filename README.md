# Ripple tools

Ripple utilities for managing wallets

## Install

npm install -g ripple-tools

## Usage

```bash
$ ripple-tools --help

Usage: ripple-tools [options]

Options:
  --address       wallet address                                        [string]
  --secret        wallet secret                                         [string]
  --generate      generate wallet                                      [boolean]
  --sequence      transaction sequence                                  [number]
  --get-sequence  get wallet sequence                                  [boolean]
  -h, --help      Show help                                            [boolean]

Wallet:
  --flags    sets flag [array] [choices: "defaultRipple", "disallowIncomingXRP",
                                                        "requireDestinationTag"]
  --trust    sets trustline (currency=XRP,counterparty=asgd,limit=10000)[string]
  --fee      sets fee                                                   [number]
  --publish  submit or load transactions                               [boolean]
  --save     saves transactions to file                                 [string]

Funding:
  --fund             fund wallet                                       [boolean]
  --funding-address  funding ripple address                             [string]
  --funding-secret   funding ripple secret                              [string]
```
## Author

Jaka Hudoklin <jaka@gatehub.net>

## License

MIT
