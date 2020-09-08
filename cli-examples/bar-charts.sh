#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-barcharts"
PATH="$PATH:$BASEDIR/../bin"

rm -rf $OUTDIR || true

mkdir -p $OUTDIR

echo '[{ "name": "alex", "value": 20 },{ "name": "brian", "value": 30 },{ "name": "craig", "value": 10 }]' > $BASEDIR/barchart-data.json

observable-prerender @d3/bar-chart chart \
    -o "$OUTDIR/bar-chart.png" -q

observable-prerender @d3/bar-chart chart \
    -o "$OUTDIR/green-bar-chart.png" \
    --redefine color:lightgreen \
    --redefine-file data:json:$BASEDIR/barchart-data.json --quiet