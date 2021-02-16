#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out"

PATH="$PATH:$BASEDIR/../bin"

mkdir -p $OUTDIR

hyperfine --export-markdown basics.md \
    "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.svg" \
    "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.png" \
    "observable-prerender @d3/bivariate-choropleth chart -o $OUTDIR/choropleth-chart.svg" \
    "observable-prerender @d3/bivariate-choropleth chart -o $OUTDIR/choropleth-chart.png" \
    "observable-prerender @asg017/covid19-cases-in-whittier-california chart -o $OUTDIR/whittier-chart.svg" \
    "observable-prerender @asg017/covid19-cases-in-whittier-california chart -o $OUTDIR/whittier-chart.png"