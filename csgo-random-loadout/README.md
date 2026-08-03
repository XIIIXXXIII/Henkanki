# CS:GO Random Loadout — Рандомное оружие каждый раунд

## Почему Qwen не мог решить

Проблема была в одной вещи: **CS:GO не поддерживает двойные кавычки внутри кавычек в alias**. Команда:

```
ent_fire weapon_knife addoutput "classname weapon_knifegg"
```

содержит кавычки, которые ломаются, если попытаться засунуть её в alias. Qwen каждый раз пытался обернуть эту команду в alias — и каждый раз ломал.

## Решение: отдельный .cfg файл

Вместо alias для `ent_fire`, мы кладём эту команду в отдельный файл `knifegg.cfg` и используем `exec knifegg`. Это обходит ограничение консоли CS:GO.

---

## Установка (одна команда в терминал Арча)

Скопируй и вставь целиком:

```bash
mkdir -p ~/.local/bin && cat > ~/.local/bin/csgo-rand <<'CSGO_EOF'
#!/usr/bin/env bash
set -euo pipefail
ROUNDS=${1:-12}
BIND=${2:-f1}
MONEY=${3:-6996}
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
  echo "ERROR: Не найден cfg легаси CS:GO (appid 4465480)" >&2
  exit 1
fi
echo "CFG: $CFG_DIR"
# File 1: knifegg.cfg — ножный трюк (НЕЛЬЗЯ класть в alias!)
cat > "$CFG_DIR/knifegg.cfg" <<'EOF'
ent_fire weapon_knife addoutput "classname weapon_knifegg"
EOF
# File 2: random_loadout.cfg
RIFLES=(weapon_ak47 weapon_m4a1 weapon_m4a1_silencer)
PISTOLS=(weapon_deagle weapon_usp_silencer weapon_revolver)
ANTI=(weapon_p90 weapon_mp7 weapon_mp9 weapon_mac10 weapon_bizon)
KNIVES=(weapon_knife_stiletto weapon_knife_karambit weapon_knife_m9_bayonet weapon_knife_butterfly
        weapon_knife_flip weapon_knife_gut weapon_knife_falchion weapon_knife_tactical
        weapon_knife_push weapon_knife_survival_bowie weapon_knife_ursus weapon_knife_canis
        weapon_knife_outdoor weapon_knife_skeleton weapon_knife_widowmaker weapon_bayonet
        weapon_knife_cord weapon_knife_css weapon_knife_gypsy_jackknife)
pick() { local a=("$@"); echo "${a[$((RANDOM % ${#a[@]}))]}"; }
OUT="$CFG_DIR/random_loadout.cfg"
{
  echo "// Generated: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "sv_cheats 1; mp_drop_knife_enable 1"
  echo "mp_maxmoney $MONEY; mp_startmoney $MONEY; mp_afterroundmoney $MONEY"
  echo "mp_buytime 9999; mp_buy_anywhere 1"
  echo "bot_difficulty 3; bot_quota 10; bot_quota_mode fill; bot_reaction_time 0.2"
  echo "bot_allow_pistols 1; bot_allow_rifles 1; bot_allow_snipers 1"
  echo "bot_allow_sub_machine_guns 1; bot_allow_shotguns 1; bot_allow_machine_guns 1; bot_allow_grenades 1"
  echo "bot_chatter minimal; bot_defer_to_human_goals 0; bot_defer_to_human_items 0"
  echo "mp_autoteambalance 1; mp_limitteams 1"
  echo "mp_timelimit 0; mp_maxrounds 30; mp_freezetime 0"
  for ((i=0; i<ROUNDS; i++)); do
    r=$((RANDOM % 100))
    if (( r < 28 )); then
      LABEL="FULL BUY"
      CMD="give $(pick "${RIFLES[@]}"); give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_hegrenade; give weapon_smokegrenade; give weapon_flashbang; give weapon_flashbang; give weapon_molotov; give weapon_incgrenade"
      CMD+="; give item_assaultsuit; give item_defuser"
    elif (( r < 48 )); then
      LABEL="AWP ROUND"
      CMD="give weapon_awp; give $(pick "${PISTOLS[@]}")"
      CMD+="; give weapon_smokegrenade; give weapon_flashbang"
      (( RANDOM % 2 == 0 )) && CMD+="; give weapon_hegrenade"
      CMD+="; give item_assaultsuit; give item_defuser"
    elif (( r < 63 )); then
      LABEL="FORCE BUY"
      CMD="give $(pick "${RIFLES[@]}"); give $(pick "${PISTOLS[@]}"); give weapon_hegrenade; give weapon_flashbang; give item_kevlar"
    elif (( r < 75 )); then
      LABEL="ANTI-ECO"
      CMD="give $(pick "${ANTI[@]}"); give $(pick "${PISTOLS[@]}"); give weapon_flashbang; give item_kevlar"
    elif (( r < 90 )); then
      LABEL="PISTOL/ECO"
      CMD="give $(pick "${PISTOLS[@]}"); give weapon_flashbang"
      (( RANDOM % 2 == 0 )) && CMD+="; give weapon_smokegrenade"
      (( RANDOM % 3 == 0 )) && CMD+="; give item_kevlar"
    else
      LABEL="BONUS DEAGLE"
      CMD="give weapon_deagle; give weapon_hegrenade"
      (( RANDOM % 2 == 0 )) && CMD+="; give item_kevlar" || CMD+="; give item_assaultsuit"
    fi
    K=$(pick "${KNIVES[@]}")
    NEXT=$(( (i+1) % ROUNDS ))
    printf 'alias step%d "echo [%s]; %s; give %s; exec knifegg; alias nextld step%d"\n' "$i" "$LABEL" "$CMD" "$K" "$NEXT"
  done
  echo 'alias nextld "step0"'
  echo "bind $BIND nextld"
} > "$OUT"
# Autoexec
AUTOEXEC="$CFG_DIR/autoexec.cfg"
grep -q "exec knifegg" "$AUTOEXEC" 2>/dev/null || echo "exec knifegg" >> "$AUTOEXEC"
grep -q "exec random_loadout" "$AUTOEXEC" 2>/dev/null || echo "exec random_loadout" >> "$AUTOEXEC"
echo "DONE! Files in $CFG_DIR:"
echo "  knifegg.cfg"
echo "  random_loadout.cfg"
echo "  autoexec.cfg"
echo ""
echo "В игре: map de_dust2 (полная загрузка карты)"
echo "Каждый раунд: $BIND — новый рандомный лут"
CSGO_EOF
chmod +x ~/.local/bin/csgo-rand
echo "Готово! Скрипт установлен: ~/.local/bin/csgo-rand"
```

---

## Как пользоваться

### 1. Запуск скрипта
```bash
~/.local/bin/csgo-rand
```
Опционально: `~/.local/bin/csgo-rand 20 f1 20000` — 20 раундов, бинд F1, 20000 денег.

### 2. В игре
1. Запусти CS:GO (легаси, appid 4465480)
2. В консоли: `map de_dust2` (или любая карта — **полная загрузка**, не mp_restartgame)
3. Жди пока загрузится, заспавнишься
4. Нажимай **F1** каждый раунд — получишь рандомный набор оружия + кастомный нож

### 3. Что происходит при нажатии F1
- В консоли покажется тип раунда: `[FULL BUY]`, `[AWP ROUND]`, `[FORCE BUY]`, `[ANTI-ECO]`, `[PISTOL/ECO]`, `[BONUS DEAGLE]`
- Даётся рандомное оружие из категории
- Даётся рандомный кастомный нож (любой кроме классического)
- Нож сохраняется в руках через `exec knifegg`
- После 12 раундов (или сколько указал) — цикл повторяется

### 4. Перегенерировать (новые рандомные сеты)
Просто запусти скрипт снова: `~/.local/bin/csgo-rand`

---

## Что за типы раундов

| Тип | Вероятность | Что выдаётся |
|-----|-------------|-------------|
| **FULL BUY** | 28% | Рифл + пистолет + хе + смоук + 2 флешки + зажигалка + фулл броня + дефуз |
| **AWP ROUND** | 20% | AWP + пистолет + смоук + флеш (+хе 50%) + фулл броня + дефуз |
| **FORCE BUY** | 15% | Рифл + пистолет + хе + флеш + кевлар |
| **ANTI-ECO** | 12% | SMG/шотган + пистолет + флеш + кевлар |
| **PISTOL/ECO** | 15% | Пистолет + флеш (+смоук/кевлар шансом) |
| **BONUS DEAGLE** | 10% | Дигл + хе + броня |

## Настройки ботов
- Уровень: эксперт (3)
- Количество: 10 (5v5)
- Реакция: 0.2 сек
- Арсенал: весь разрешён
- Автобаланс: включён
- Боты дефьюзят, бросают гранаты, покупают лучшее оружие

## Доступные ножи
Стилет, карамбит, M9, бабочка, флип, гут, фальшион, хантсмен, даги, боуи, урсус, канис (survival), корд (paracord), наваха, скелетон, талон, штык, классика.

## Полезные бонусные команды (вводить вручную в консоли)
```
sv_showimpacts 1        — показывает, куда реально попали пули
sv_grenade_trajectory 1 — трассировка гранат
bot_dont_shoot 1        — боты не стреляют (режим прицеливания)
host_timescale 0.5      — замедление времени
```
