#!/usr/bin/env bash
# Smoke test for the LeanScan API.
# Walks through the full auth + profile + onboarding flow.
# Asserts on the standardized { success, message, data, error } envelope.
#
# Usage:
#   bash scripts/smoke-test.sh
#   API_URL=http://192.168.0.107:3000 bash scripts/smoke-test.sh
set -uo pipefail

API="${API_URL:-http://localhost:3000}"
EMAIL="smoke-$(date +%s)@leanscan.test"
PASS="smokepass123"

GREEN="\033[0;32m"
RED="\033[0;31m"
DIM="\033[2m"
RESET="\033[0m"

pass() { printf "  ${GREEN}✓${RESET} %s\n" "$1"; }
fail() { printf "  ${RED}✗${RESET} %s\n     ${DIM}%s${RESET}\n" "$1" "$2"; exit 1; }
step() { printf "\n${DIM}→${RESET} %s\n" "$1"; }

extract() {
  python3 -c "
import sys, json
try:
    d = json.loads(sys.argv[1])
    for k in sys.argv[2].split('.'):
        d = d[k]
    print(d)
except Exception:
    sys.exit(1)
" "$1" "$2" 2>/dev/null
}

printf "Testing %s\n" "$API"

# -------------------------------------------------------------
step "GET /health"
RES=$(curl -s "$API/health")
[ "$(extract "$RES" success)" = "True" ] && pass "alive ($(extract "$RES" message))" || fail "/health" "$RES"

step "GET /health/ready"
RES=$(curl -s "$API/health/ready")
[ "$(extract "$RES" data.database)" = "ok" ] && pass "db reachable" || fail "/health/ready" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/signup ($EMAIL)"
RES=$(curl -s -X POST "$API/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
ACCESS=$(extract "$RES" data.access_token)
REFRESH=$(extract "$RES" data.refresh_token)
USER_ID=$(extract "$RES" data.user.id)
CREDITS=$(extract "$RES" data.user.credit_balance)
MSG=$(extract "$RES" message)
[ "$(extract "$RES" success)" = "True" ] && [ -n "$ACCESS" ] && pass "$MSG (user_id=$USER_ID, credits=$CREDITS)" || fail "signup" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/signup (duplicate, expect 409)"
RES=$(curl -s -X POST "$API/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
[ "$(extract "$RES" success)" = "False" ] && [ "$(extract "$RES" error.code)" = "email_in_use" ] && pass "duplicate rejected" || fail "dup signup" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/login (correct password)"
RES=$(curl -s -X POST "$API/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")
LOGIN_ACCESS=$(extract "$RES" data.access_token)
[ -n "$LOGIN_ACCESS" ] && pass "$(extract "$RES" message)" || fail "login" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/login (wrong password, expect 401)"
RES=$(curl -s -X POST "$API/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrongwrongwrong\"}")
[ "$(extract "$RES" error.code)" = "invalid_credentials" ] && pass "wrong password rejected ($(extract "$RES" message))" || fail "bad password not rejected" "$RES"

# -------------------------------------------------------------
step "GET /v1/auth/me"
RES=$(curl -s "$API/v1/auth/me" -H "Authorization: Bearer $ACCESS")
[ "$(extract "$RES" data.email)" = "$EMAIL" ] && pass "me returns this user" || fail "me" "$RES"

# -------------------------------------------------------------
step "GET /v1/auth/me (no token, expect 401)"
RES=$(curl -s "$API/v1/auth/me")
[ "$(extract "$RES" error.code)" = "unauthorized" ] && pass "missing token rejected" || fail "unauth me" "$RES"

# -------------------------------------------------------------
step "GET /v1/profile"
RES=$(curl -s "$API/v1/profile" -H "Authorization: Bearer $ACCESS")
[ "$(extract "$RES" data.email)" = "$EMAIL" ] && pass "$(extract "$RES" message)" || fail "profile" "$RES"

# -------------------------------------------------------------
step "PATCH /v1/profile (goal=recomp, weight=80kg, activity=moderate)"
RES=$(curl -s -X PATCH "$API/v1/profile" \
  -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d '{"goal":"recomp","height_cm":175,"weight_kg":80,"activity_level":"moderate"}')
PROTEIN_TARGET=$(extract "$RES" data.proteinTargetG)
GOAL=$(extract "$RES" data.goal)
[ "$GOAL" = "recomp" ] && pass "$(extract "$RES" message) — protein target ${PROTEIN_TARGET}g" || fail "profile patch" "$RES"

# -------------------------------------------------------------
step "POST /v1/onboarding/complete (+20 bonus credits)"
RES=$(curl -s -X POST "$API/v1/onboarding/complete" -H "Authorization: Bearer $ACCESS")
GRANTED=$(extract "$RES" data.credits_granted)
NEW_BAL=$(extract "$RES" data.credit_balance)
[ "$GRANTED" = "20" ] && pass "$(extract "$RES" message) (balance $NEW_BAL)" || fail "onboarding" "$RES"

# -------------------------------------------------------------
step "POST /v1/onboarding/complete (idempotent, no double bonus)"
RES=$(curl -s -X POST "$API/v1/onboarding/complete" -H "Authorization: Bearer $ACCESS")
ALREADY=$(extract "$RES" data.already_completed)
[ "$ALREADY" = "True" ] && pass "$(extract "$RES" message)" || fail "onboarding repeat" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/refresh"
RES=$(curl -s -X POST "$API/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}")
NEW_ACCESS=$(extract "$RES" data.access_token)
[ -n "$NEW_ACCESS" ] && pass "$(extract "$RES" message)" || fail "refresh" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/logout"
RES=$(curl -s -X POST "$API/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}")
[ "$(extract "$RES" success)" = "True" ] && pass "$(extract "$RES" message)" || fail "logout" "$RES"

# -------------------------------------------------------------
step "POST /v1/auth/refresh (after logout, expect 401)"
RES=$(curl -s -X POST "$API/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}")
[ "$(extract "$RES" error.code)" = "invalid_refresh_token" ] && pass "$(extract "$RES" message)" || fail "revoked refresh accepted!" "$RES"

# -------------------------------------------------------------
printf "\n${GREEN}🎉 All auth + profile + onboarding endpoints passed.${RESET}\n\n"
