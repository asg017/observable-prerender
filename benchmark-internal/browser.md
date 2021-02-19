| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `../bin/observable-prerender @d3/bar-chart chart -o -` | 1.367 ± 0.445 | 1.065 | 2.235 | 3.94 ± 2.64 |
| `../bin/observable-prerender @d3/bar-chart chart -o - --browser-wsendpoint ws://127.0.0.1:53496/devtools/browser/d88565c0-23f7-40bd-88c5-817bbe4e57f0` | 0.993 ± 0.051 | 0.941 | 1.124 | 2.86 ± 1.68 |
| `../bin/observable-prerender @d3/bar-chart chart -o - --browser-wsendpoint ws://127.0.0.1:53518/devtools/browser/ff52357a-44e2-4fbc-b25d-be61bc46cf11` | 0.347 ± 0.204 | 0.251 | 0.923 | 1.00 |
