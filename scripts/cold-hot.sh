#!/usr/bin/env bash

set -e

if [ -z $FUNDING_SEQUENCE ]; then
	echo "FUNDING_SEQUENCE not set"
	exit 1
fi

if [ -z $FUNDING_SECRET ]; then
	echo "FUNDING_SECRET not set"
	exit 1
fi

if [ -z $FUNDING_ADDRESS ]; then
	echo "FUNDING_ADDRESS not set"
	exit 1
fi

echo "-> Generating wallets"
echo -n "* cold wallet: "
ripple-tools generate --format json > cold_wallet.json
COLD_ADDRESS=$(cat cold_wallet.json | jq -r '.address')
COLD_SECRET=$(cat cold_wallet.json | jq -r '.secret')
echo ${COLD_ADDRESS}

echo -n "* hot wallet: "
ripple-tools generate --format json > hot_wallet.json
HOT_ADDRESS=$(cat hot_wallet.json | jq -r '.address')
HOT_SECRET=$(cat hot_wallet.json | jq -r '.secret')
echo ${HOT_ADDRESS}

echo "* funding sequence: $FUNDING_SEQUENCE"

echo "-> generating transactions"
echo "* tx funding hot wallet"
ripple-tools send-payment \
	--amount 50 --to $COLD_ADDRESS --sequence $FUNDING_SEQUENCE  \
	--address $FUNDING_ADDRESS --secret $FUNDING_SECRET \
	--format json --export > transactions.json

echo "* tx funding cold wallet"
ripple-tools send-payment \
	--amount 50 --to $HOT_ADDRESS --sequence $((FUNDING_SEQUENCE+1)) \
	--address $FUNDING_ADDRESS --secret $FUNDING_SECRET \
	--format json --export >> transactions.json

echo "* tx setting flags on cold wallet"
ripple-tools set-flag defaultRipple \
	--offline \
    --address $COLD_ADDRESS \
    --secret $COLD_SECRET \
    --sequence 1 --format json --export >> transactions.json
ripple-tools set-flag requireDestinationTag \
	--offline \
    --address $COLD_ADDRESS \
    --secret $COLD_SECRET \
    --sequence 2 --format json --export >> transactions.json
ripple-tools set-flag disallowIncomingXRP \
	--offline \
    --address $COLD_ADDRESS \
    --secret $COLD_SECRET \
    --sequence 3 --format json --export >> transactions.json

echo "* tx hot -> cold trust line"
ripple-tools set-trust \
	--offline \
    --address $HOT_ADDRESS \
    --secret $HOT_SECRET \
    --counterparty $COLD_ADDRESS \
    --currency USD \
    --sequence 1 --format json --export >> transactions.json

echo "-> done"
