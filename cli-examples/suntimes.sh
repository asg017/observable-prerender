#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-suntimes"
PATH="$PATH:$BASEDIR/../bin"

rm -rf $OUTDIR || true

mkdir -p $OUTDIR
mkdir -p $OUTDIR/frames

observable-prerender-animate \
	@asg017/sunrise-and-sunset-worldwide graphic \
    --iter-waitfor controller \
    --iter-index \
	--iter timeI:times \
    --out-dir $OUTDIR/frames 

 ffmpeg -framerate 30 \
    -i $OUTDIR/frames/%03d_graphic.png \
    -c:v libx264  -pix_fmt yuv420p \
    $OUTDIR/suntimes.mp4