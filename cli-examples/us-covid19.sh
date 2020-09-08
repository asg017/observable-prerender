#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-uscovid"
PATH="$PATH:$BASEDIR/../bin"

rm -rf $OUTDIR || true

mkdir -p $OUTDIR
mkdir -p $OUTDIR/frames

observable-prerender-animate \
	@mbostock/covid-19-daily-new-cases chart \
	--iter-waitfor update \
	--iter date:dates \
	--out-dir $OUTDIR/frames \
	--format png

ffmpeg -framerate 15 \
    -i $OUTDIR/frames/%03d_chart.png \
    -c:v libx264  -pix_fmt yuv420p \
	-vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" \
    $OUTDIR/us-covid19-daily.mp4