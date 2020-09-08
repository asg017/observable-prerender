#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-nations"
PATH="$PATH:$BASEDIR/../bin"

rm -rf $OUTDIR || true

mkdir -p $OUTDIR
mkdir -p $OUTDIR/frames

observable-prerender-animate \
	d/9edd920538384e6b chart \
	--iter-waitfor update \
	--iter year:years \
	--out-dir $OUTDIR/frames \
	--format png


 ffmpeg -framerate 30 \
    -i $OUTDIR/frames/%04d_chart.png \
    -c:v libx264  -pix_fmt yuv420p \
    $OUTDIR/health-wealth-nations.mp4