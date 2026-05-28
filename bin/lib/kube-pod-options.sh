#!/usr/bin/env bash
# Shared defaults and argument parser for ephemeral Kubernetes pods.
#
# Usage in a script:
#   source "$(dirname "$0")/lib/kube-pod-options.sh"
#   parse_kube_pod_options "$@"
#   # MEMORY, CPU, POD_RUNNING_TIMEOUT are now set.
#   # REMAINING_ARGS contains any args this parser did not consume.

MEMORY="${MEMORY:-512Mi}"
CPU="${CPU:-1000m}"
POD_RUNNING_TIMEOUT="${POD_RUNNING_TIMEOUT:-2m}"
REMAINING_ARGS=()

parse_kube_pod_options() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --memory)  MEMORY="$2";              shift 2 ;;
      --cpu)     CPU="$2";                 shift 2 ;;
      --timeout) POD_RUNNING_TIMEOUT="$2"; shift 2 ;;
      *)         REMAINING_ARGS+=("$1");   shift   ;;
    esac
  done
}
