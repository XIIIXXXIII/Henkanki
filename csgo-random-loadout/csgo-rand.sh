#!/usr/bin/env bash
# ============================================================
# CS:GO Random Loadout Generator (v2 - working approach)
# Works with legacy CS:GO (appid 4465480)
# 
# KEY INSIGHT (confirmed by Grok):
# - ent_fire weapon_knife addoutput does NOT work in this build
# - give weapon_knife_X drops the knife on the ground (red/purple)
# - You MUST press E to pick it up (auto-pickup by walking doesn't work)
# - So the approach: slot3 -> drop -> give weapons -> give knife -> press E
# ============================================================
set -euo pipefail

ROUNDS=${1:-12}
BIND=${2:-f1}
MONEY=${3:-6996}

# Find CS:GO cfg directory
if [[ -n "${CSGO_TEST_DIR:-}" ]]; then
  CFG_DIR="$CSGO_TEST_DIR"
  mkdir -p "$CFG_DIR"
else
  STEAM="${STEAM_RUNTIME:-$HOME/.local/share/Steam}"
  MANIFEST="$STEAM/steamapps/appmanifest_4465480.acf"
  CFG_DIR=""

  if [[ -f "$MANIFEST" ]]; then
    INSTALLDIR="$(sed -n 's/^[[:space:]]*"installdir"[[:space:]]*"\([^"]*\)".*/\1/Ip' "$MANIFEST")"
    [[ -n "$INSTALLDIR" ]] && CFG_DIR="$STEAM/steamapps/common/$INSTALLDIR/csgo/cfg"
  fi

  if [[ -z "$CFG_DIR" || ! -d "$CFG_DIR" ]]; then
    CFG_DIR="$(find "$STEAM/steamapps/common" -maxdepth 4 -type d -path '*/csgo/cfg' ! -path '*/game/*' 2>/dev/null | head -n1)"
  fi

  if [[ -z "$CFG_DIR" || ! -d "$CFG_DIR" ]]; then
    echo "ERROR: Could not find CS:GO legacy cfg directory" >&2
    echo "Searched: $STEAM/steamapps/common" >&2
    echo "To test: CSGO_TEST_DIR=/tmp/test_cfg ./csgo-rand.sh" >&2
    exit 1
  fi
fi

echo "CFG directory: $CFG_DIR"

# ============================================================
# Weapon pools
# ============================================================
RIFLES=(weapon_ak47 weapon_m4a1 weapon_m4a1_silencer)
PISTOLS=(weapon_deagle weapon_usp_silencer weapon_revolver)
ANTI=(weapon_p90 weapon_mp7 weapon_mp9 weapon_mac10 weapon_bizon)
KNIVES=(weapon_knife_stiletto weapon_knife_karambit weapon_knife_m9_bayonet weapon_knife_butterfly
        weapon_knife_flip weapon_knife_gut weapon_knife_falchion weapon_knife_tactical
        weapon_knife_push weapon_knife_survival_bowie weapon_knife_ursus weapon_knife_canis
        weapon_knife_outdoor weapon_knife_skeleton weapon_knife_widowmaker weapon_bayonet
        weapon_knife_cord weapon_knife_css weapon_knife_gypsy_jackknife)

pick() {
  local arr=("$@")
  echo "${arr[$((RANDOM % ${#arr[@]}))]}"
}

OUT="$CFG_DIR/random_loadout.cfg"

{
  echo "// === CS:GO Random Loadout v2 ==="
  echo "// Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "// Rounds: $ROUNDS | Keybind: $BIND | Money: $MONEY"
  echo "// APPROACH: No ent_fire (broken in this build). Knife drops on ground, press E."
  echo ""
  echo "// --- Base settings ---"
  echo "sv_cheats 1"
  echo "mp_drop_knife_enable 1"
  echo "mp_maxmoney $MONEY"
  echo "mp_startmoney $MONEY"
  echo "mp_afterroundmoney $MONEY"
  echo "mp_buytime 9999"
  echo "mp_buy_anywhere 1"
  echo ""
  echo "// --- Bot settings: expert level, full arsenal ---"
  echo "bot_difficulty 3"
  echo "bot_quota 10"
  echo "bot_quota_mode fill"
  echo "bot_reaction_time 0.2"
  echo "bot_allow_pistols 1; bot_allow_rifles 1; bot_allow_snipers 1"
  echo "bot_allow_sub_machine_guns 1; bot_allow_shotguns 1; bot_allow_machine_guns 1; bot_allow_grenades 1"
  echo "bot_chatter minimal"
  echo "bot_defer_to_human_goals 0; bot_defer_to_human_items 0"
  echo "mp_autoteambalance 1; mp_limitteams 1"
  echo "mp_timelimit 0"
  echo "mp_maxrounds 30"
  echo "mp_roundtime 120"
  echo "mp_freezetime 0"
  echo "mp_round_restart_delay 2"
  echo ""

  # Generate each round
  for ((i=0; i<ROUNDS; i++)); do
    # Pick round type
    r=$((RANDOM % 100))
    if (( r < 28 )); then
      LABEL="FULL BUY"
      CMD="give $(pick "${RIFLES[@]}"); give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_hegrenade; give weapon_smokegrenade; give weapon_flashbang; give weapon_flashbang"
      CMD+="; give weapon_molotov; give weapon_incgrenade"
      CMD+="; give item_assaultsuit; give item_defuser"
    elif (( r < 48 )); then
      LABEL="AWP ROUND"
      CMD="give weapon_awp; give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_smokegrenade; give weapon_flashbang"
      if (( RANDOM % 2 == 0 )); then CMD+="; give weapon_hegrenade"; fi
      CMD+="; give item_assaultsuit; give item_defuser"
    elif (( r < 63 )); then
      LABEL="FORCE BUY"
      CMD="give $(pick "${RIFLES[@]}"); give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_hegrenade; give weapon_flashbang; give item_kevlar"
    elif (( r < 75 )); then
      LABEL="ANTI-ECO"
      CMD="give $(pick "${ANTI[@]}"); give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_flashbang; give item_kevlar"
    elif (( r < 90 )); then
      LABEL="PISTOL/ECO"
      CMD="give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_flashbang"
      if (( RANDOM % 2 == 0 )); then CMD+="; give weapon_smokegrenade"; fi
      if (( RANDOM % 3 == 0 )); then CMD+="; give item_kevlar"; fi
    else
      LABEL="BONUS DEAGLE"
      CMD="give weapon_deagle; give weapon_hegrenade"
      if (( RANDOM % 2 == 0 )); then CMD+="; give item_kevlar"; else CMD+="; give item_assaultsuit"; fi
    fi

    # Pick knife for this round
    KNIFE=$(pick "${KNIVES[@]}")
    NEXT=$(( (i + 1) % ROUNDS ))

    # The approach:
    # 1. slot3 -> drop — drops current knife, freeing the melee slot
    # 2. give weapons — new weapons into hands
    # 3. give knife — knife drops on ground (red/purple)
    # 4. User presses E to pick it up
    # 5. Chain to next step
    printf 'alias step%d "echo [%s]; slot3; drop; %s; give %s; echo == НОЖ УПАЛ - НАЖМИ E ==; alias nextld step%d"\n' \
      "$i" "$LABEL" "$CMD" "$KNIFE" "$NEXT"
  done

  echo 'alias nextld "step0"'
  echo "bind $BIND nextld"

} > "$OUT"

echo "Created random_loadout.cfg ($ROUNDS rounds, bind: $BIND)"

# ============================================================
# Autoexec addition
# ============================================================
AUTOEXEC="$CFG_DIR/autoexec.cfg"
if ! grep -q "exec random_loadout" "$AUTOEXEC" 2>/dev/null; then
  echo "exec random_loadout" >> "$AUTOEXEC"
  echo "Added 'exec random_loadout' to autoexec.cfg"
fi

echo ""
echo "=== DONE ==="
echo ""
echo "HOW TO USE:"
echo "1. In CS:GO console: map de_dust2 (or any map)"
echo "2. Wait for map to load, spawn in"
echo "3. Every round press $BIND — you get weapons + knife drops at your feet"
echo "4. Press E to pick up the knife"
echo "5. After $ROUNDS rounds it loops back to step0"
echo ""
echo "To regenerate (new random sets):"
echo "  $0 $ROUNDS $BIND $MONEY"
echo ""
echo "File: $OUT"
