#!/bin/bash
# Strip --remap-path-scope=* which the Succinct rustc fork doesn't support
# (it only accepts the unstable -Z remap-path-scope form).
args=()
for arg in "$@"; do
    [[ "$arg" == --remap-path-scope=* ]] || args+=("$arg")
done
exec "${args[@]}"
