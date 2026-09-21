#!/usr/bin/env bash
# One-command deploy: provisions and deploys every Worker (deploy-all.sh),
# then sets up custom domains + Cloudflare Access for all of them
# (wire-access.sh) - both driven by the single CLOUDFLARE_API_TOKEN in
# config.sh.
#
# Usage:
#   1. cp config.sh.example config.sh, fill in CLOUDFLARE_ACCOUNT_ID and
#      CLOUDFLARE_API_TOKEN (see config.sh.example for the exact token
#      permissions needed)
#   2. ./deploy.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$ROOT/deploy-all.sh"
"$ROOT/wire-access.sh"
