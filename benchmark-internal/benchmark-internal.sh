#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out"

PATH="$PATH:$BASEDIR/../bin"

mkdir -p $OUTDIR

bm_basic () {
    hyperfine --export-markdown basics.md \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.svg" \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.png" \
        "observable-prerender @d3/bivariate-choropleth chart -o $OUTDIR/choropleth-chart.svg" \
        "observable-prerender @d3/bivariate-choropleth chart -o $OUTDIR/choropleth-chart.png" \
        "observable-prerender @asg017/covid19-cases-in-whittier-california chart -o $OUTDIR/whittier-chart.svg" \
        "observable-prerender @asg017/covid19-cases-in-whittier-california chart -o $OUTDIR/whittier-chart.png"
}

bm_format() {
    hyperfine --export-markdown format.md \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.svg" \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.png" \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.jpeg" \
        "observable-prerender @d3/bar-chart chart -o $OUTDIR/bar-chart.html"
}

bm_browser() {
    node start-headed-browser.js > headed_ws.tmp & 
    HEADED_PID=$!
    sleep 3
    HEADED_WS=$(cat headed_ws.tmp)

    node start-headless-browser.js > headless_ws.tmp & 
    HEADLESS_PID=$!
    sleep 3
    HEADLESS_WS=$(cat headless_ws.tmp)

    echo $HEADED_PID $HEADED_WS 
    echo $HEADLESS_PID $HEADLESS_WS 
    echo $OUTDIR
    hyperfine --export-markdown browser.md \
        "../bin/observable-prerender @d3/bar-chart chart -o -" \
        "../bin/observable-prerender @d3/bar-chart chart -o - --browser-wsendpoint $HEADED_WS" \
        "../bin/observable-prerender @d3/bar-chart chart -o - --browser-wsendpoint $HEADLESS_WS"  
    
    kill $HEADED_PID $HEADLESS_PID
    
    rm headed_ws.tmp headless_ws.tmp
}

bm() {
    bm_basic
    bm_format
    bm_browser
}

bm