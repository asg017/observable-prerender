#!/bin/bash
BASEDIR=$(dirname "$0")
OUTDIR="$BASEDIR/out-calendar"
PATH="$PATH:$BASEDIR/../bin"

if [ -e $BASEDIR/dji.csv ]
then
    :
else
    echo "Download the CSV at https://finance.yahoo.com/quote/%5EDJI/history/ and save it as 'dji.csv' in the cli-examples directory."
	exit
fi

rm -rf $OUTDIR || true

mkdir -p $OUTDIR

observable-prerender @d3/calendar-view chart \
    -o "$OUTDIR/calendar-2000s.png" \
    --file-attachments ^DJI@2.csv:$BASEDIR/dji.csv 

observable-prerender @d3/calendar-view chart \
    -o "$OUTDIR/calendar-2020.png" \
    --file-attachments ^DJI@2.csv:<(csvgrep -c Date -r "2020*" $BASEDIR/dji.csv) 