#!/bin/bash
set -euo pipefail

BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-benchmark"
PATH="$PATH:$BASEDIR/../bin"

rm -rf $OUTDIR || true
mkdir -p $OUTDIR

RESULTS="$OUTDIR/results.ndjson"

rm $RESULTS || true
touch $RESULTS

observable-prerender-benchmark @d3/world-airports map  >> $RESULTS
observable-prerender-benchmark @d3/u-s-state-capitals map  >> $RESULTS
observable-prerender-benchmark @mbostock/u-s-airports-voronoi chart  >> $RESULTS
observable-prerender-benchmark @jashkenas/world-cities-delaunay chart  >> $RESULTS
observable-prerender-benchmark @mbostock/lets-try-t-sne chart  >> $RESULTS
observable-prerender-benchmark @codingwithfire/hhs-hospital-data-visualizations-iv hospitalDots  >> $RESULTS
observable-prerender-benchmark @codingwithfire/cmu-covidcast-api-bubbles-export map  >> $RESULTS
observable-prerender-benchmark @codingwithfire/voronoi-purpleair map  >> $RESULTS
observable-prerender-benchmark @asg017/covid19-cases-in-whittier-california chart  >> $RESULTS
observable-prerender-benchmark @karimdouieb/2016-u-s-presidential-election vote_map_population_split_bubble  >> $RESULTS
observable-prerender-benchmark @d3/choropleth chart  >> $RESULTS