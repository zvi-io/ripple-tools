# Ripple tools

Ripple utilities for managing wallets

**Work in progress**

## Install

npm install -g ripple-tools

## Usage

```bash
$ ripple-tools --help

Usage: bin/ripple-tools <command> [options]

Commands:
  generate         Generate wallet
  set-flag <flag>  Set wallet flag
  set-fee <fee>    Set wallet fee
  set-trust        Set trustline
  get-info         Gets account info
  get-balances     Gets account balances
  send-payment     Sends payment
  submit [tx]      Submit raw transactions to ripple

Options:
  --address    wallet address                                           [string]
  --secret     wallet secret                                            [string]
  --format     output format[string] [choices: "yaml", "json"] [default: "yaml"]
  --verbose    be verbose                                              [boolean]
  --export     export transaction                                      [boolean]
  --sequence   wallet sequence                                          [number]
  --fee        set transaction fee                                      [string]
  --offline    start ripple api in offline mode                        [boolean]
  -h, --help   Show help                                               [boolean]
```
## Author

Jaka Hudoklin <jaka@gatehub.net>

## License

MIT
