#!/usr/bin/env bash
# =============================================================================
# Master Website Generator - Interactive Menu
# Creates a new website from the master template with custom
# theme, style, icons, card model, content, and features.
# =============================================================================
set +e  # Don't exit on read EOF during piped input

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GENERATOR="${SCRIPT_DIR}/generator.py"
BUILD_CONFIG="${SCRIPT_DIR}/.build-config.json"

# Colors for terminal
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
YELLOW=$'\033[1;33m'
PURPLE=$'\033[0;35m'
CYAN=$'\033[0;36m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
NC=$'\033[0m'

clear
echo ""
echo -e "${BOLD}${CYAN}================================================================${NC}"
echo -e "${BOLD}${CYAN}       MASTER WEBSITE GENERATOR${NC}"
echo -e "${BOLD}${CYAN}================================================================${NC}"
echo ""
echo -e "  This tool generates a complete, deploy-ready website"
echo -e "  from the master template with your chosen customizations."
echo -e "  ${DIM}Your existing master files are never modified.${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Site Identity
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 1/8: Site Identity ---${NC}"
echo ""
read -p "  Site name (e.g. Trishanku Baba): " SITE_NAME
SITE_NAME="${SITE_NAME:-My Store}"

read -p "  Tagline: " SITE_TAGLINE
SITE_TAGLINE="${SITE_TAGLINE:-Your trusted source for premium products.}"

read -p "  Contact email: " CONTACT_EMAIL
CONTACT_EMAIL="${CONTACT_EMAIL:-admin@example.com}"

read -p "  Contact phone (e.g. +977-9800000000): " CONTACT_PHONE
CONTACT_PHONE="${CONTACT_PHONE:-+977-9800000000}"

read -p "  City: " CITY
CITY="${CITY:-Kathmandu}"

read -p "  Province: " PROVINCE
PROVINCE="${PROVINCE:-Bagmati}"

read -p "  Country: " COUNTRY
COUNTRY="${COUNTRY:-Nepal}"

read -p "  Exchange rate (USD to NPR, e.g. 133.50): " EXCHANGE_RATE
EXCHANGE_RATE="${EXCHANGE_RATE:-133.50}"

PROJECT_NAME=$(echo "$SITE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
echo ""
echo -e "  ${DIM}Cloudflare project: ${PROJECT_NAME}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Theme Selection (with Custom option)
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 2/8: Select Theme (Color Palette) ---${NC}"
echo ""
THEMES=()
for f in "${SCRIPT_DIR}"/themes/*.json; do
    [ -f "$f" ] || continue
    slug=$(basename "$f" .json)
    name=$(python3 -c "import json; print(json.load(open('$f'))['name'])" 2>/dev/null || echo "$slug")
    desc=$(python3 -c "import json; print(json.load(open('$f'))['description'])" 2>/dev/null || "")
    THEMES+=("$slug")
    echo -e "  ${GREEN}[$((${#THEMES[@]}))]${NC} ${BOLD}${name}${NC} ${DIM}- ${desc}${NC}"
done
# Add custom option
echo -e "  ${YELLOW}[$((${#THEMES[@]}+1))]${NC} ${BOLD}Custom Theme${NC} ${DIM}- Create your own color palette${NC}"
echo ""
read -p "  Choose theme [1-${#THEMES[@]}] or $((${#THEMES[@]}+1)) for custom (default: 1): " THEME_CHOICE
THEME_CHOICE="${THEME_CHOICE:-1}"
CUSTOM_THEME="no"

if [[ "$THEME_CHOICE" == "$((${#THEMES[@]}+1))" ]]; then
    CUSTOM_THEME="yes"
    echo ""
    echo -e "  ${BOLD}${YELLOW}=== Custom Theme Builder ===${NC}"
    echo ""
    echo -e "  ${DIM}Enter 3 hex colors for your palette (primary, secondary, accent)${NC}"
    echo -e "  ${DIM}Example: #059669 #10B981 #F59E0B${NC}"
    echo ""

    # Pick a base to copy structure from
    read -p "  Primary color (e.g. #059669): " CUSTOM_PRIMARY
    CUSTOM_PRIMARY="${CUSTOM_PRIMARY:-#059669}"
    read -p "  Secondary color (e.g. #10B981): " CUSTOM_SECONDARY
    CUSTOM_SECONDARY="${CUSTOM_SECONDARY:-#10B981}"
    read -p "  Accent color (e.g. #F59E0B): " CUSTOM_ACCENT
    CUSTOM_ACCENT="${CUSTOM_ACCENT:-#F59E0B}"

    # Generate custom theme JSON using Python
    CUSTOM_THEME_FILE="${SCRIPT_DIR}/.custom-theme.json"
    python3 -c "
import json
p = '${CUSTOM_PRIMARY}'.lstrip('#')
s = '${CUSTOM_SECONDARY}'.lstrip('#')
a = '${CUSTOM_ACCENT}'.lstrip('#')

def hex_to_rgb(h):
    h = h.lstrip('#')
    return ', '.join(str(int(h[i:i+2], 16)) for i in (0, 2, 4))

def lighten(h, factor=0.95):
    h = h.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    r = min(255, int(r + (255-r)*factor))
    g = min(255, int(g + (255-g)*factor))
    b = min(255, int(b + (255-b)*factor))
    return '#{:02x}{:02x}{:02x}'.format(r,g,b).upper()

def darken(h, factor=0.3):
    h = h.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    return '#{:02x}{:02x}{:02x}'.format(int(r*factor), int(g*factor), int(b*factor)).upper()

def shade(h, idx):
    idxs = {50:0.95,100:0.9,200:0.75,300:0.55,400:0.35,500:0,600:0.15,700:0.3,800:0.45,900:0.6,950:0.8}
    f = idxs.get(idx, 0)
    h = h.lstrip('#')
    r, g, b = int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    if f > 0:
        r = min(255, int(r + (255-r)*f))
        g = min(255, int(g + (255-g)*f))
        b = min(255, int(b + (255-b)*f))
    else:
        f = abs(f)
        r = max(0, int(r * (1-f)))
        g = max(0, int(g * (1-f)))
        b = max(0, int(b * (1-f)))
    return '#{:02x}{:02x}{:02x}'.format(r,g,b).upper()

theme = {
    'name': 'Custom Theme',
    'description': 'User-defined color palette',
    'tailwind': {
        'emerald': {str(k): shade(p, k) for k in [50,100,200,300,400,500,600,700,800,900,950]},
        'green': {str(k): shade(s, k) for k in [50,100,200,300,400,500,600,700,800,900,950]},
        'amber': {str(k): shade(a, k) for k in [50,100,200,300,400,500,600,700,800,900]}
    },
    'css': {
        'body_bg': lighten(p, 0.98),
        'body_text': darken(p, 0.18),
        'scrollbar': shade(p, 200),
        'scrollbar_hover': shade(p, 300),
        'gradient_start': shade(p, 400),
        'gradient_mid': shade(p, 300),
        'gradient_end': shade(s, 400),
        'category_active_bg': shade(p, 600),
        'category_active_text': '#ffffff',
        'category_text': shade(p, 700),
        'category_hover_bg': shade(p, 50),
        'skeleton_start': shade(p, 50),
        'skeleton_mid': shade(p, 100),
        'card_shadow_rgba': hex_to_rgb(p),
        'card_hover_shadow_rgba': hex_to_rgb(p),
        'toast_bg': shade(p, 600),
        'toast_error_bg': '#EF4444',
        'bg_image': 'none',
        'bg_repeat': 'no-repeat',
        'bg_size': 'auto'
    }
}
with open('${CUSTOM_THEME_FILE}', 'w') as f:
    json.dump(theme, f, indent=2)
print('  Custom theme generated!')
"
    SELECTED_THEME=".custom-theme"
else
    if [[ "$THEME_CHOICE" -lt 1 || "$THEME_CHOICE" -gt "${#THEMES[@]}" ]]; then
        THEME_CHOICE=1
    fi
    SELECTED_THEME="${THEMES[$((THEME_CHOICE-1))]}"
fi
echo -e "  ${GREEN}OK${NC} Selected: ${BOLD}${SELECTED_THEME}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Style Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 3/8: Select Style (Typography + Layout) ---${NC}"
echo ""
STYLES=()
for d in "${SCRIPT_DIR}"/styles/*/; do
    [ -f "$d/config.json" ] || continue
    name=$(python3 -c "import json; print(json.load(open('${d}config.json'))['name'])" 2>/dev/null || basename "$d")
    desc=$(python3 -c "import json; print(json.load(open('${d}config.json'))['description'])" 2>/dev/null || "")
    font=$(python3 -c "import json; print(json.load(open('${d}config.json'))['font_name'])" 2>/dev/null || "")
    STYLES+=("$(basename "$d")")
    echo -e "  ${BLUE}[$((${#STYLES[@]}))]${NC} ${BOLD}${name}${NC} ${DIM}(${font}) - ${desc}${NC}"
done
echo ""
read -p "  Choose style [1-${#STYLES[@]}] (default: 1): " STYLE_CHOICE
STYLE_CHOICE="${STYLE_CHOICE:-1}"
if [[ "$STYLE_CHOICE" -lt 1 || "$STYLE_CHOICE" -gt "${#STYLES[@]}" ]]; then
    STYLE_CHOICE=1
fi
SELECTED_STYLE="${STYLES[$((STYLE_CHOICE-1))]}"
echo -e "  ${GREEN}OK${NC} Selected: ${BOLD}${SELECTED_STYLE}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Icon Pack Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 4/8: Select Icon Pack ---${NC}"
echo ""
ICONS=()
for d in "${SCRIPT_DIR}"/icons/*/; do
    [ -f "$d/mapping.json" ] || continue
    ICONS+=("$(basename "$d")")
    case "$(basename "$d")" in
        lucide)      echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Lucide${NC} ${DIM}- Clean line icons (original default)${NC}" ;;
        fontawesome)  echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Font Awesome 6${NC} ${DIM}- Classic icon font, huge library${NC}" ;;
        heroicons)   echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Heroicons${NC} ${DIM}- Modern SVG icons by Tailwind team${NC}" ;;
        emoji)       echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Emoji Only${NC} ${DIM}- No library, pure emoji fallbacks${NC}" ;;
        *)           echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}$(basename "$d")${NC}" ;;
    esac
done
echo ""
read -p "  Choose icons [1-${#ICONS[@]}] (default: 1): " ICON_CHOICE
ICON_CHOICE="${ICON_CHOICE:-1}"
if [[ "$ICON_CHOICE" -lt 1 || "$ICON_CHOICE" -gt "${#ICONS[@]}" ]]; then
    ICON_CHOICE=1
fi
SELECTED_ICONS="${ICONS[$((ICON_CHOICE-1))]}"
echo -e "  ${GREEN}OK${NC} Selected: ${BOLD}${SELECTED_ICONS}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 5: Card Model Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 5/8: Select Card Model (Product Card Layout) ---${NC}"
echo ""
MODELS=()
for d in "${SCRIPT_DIR}"/models/*/; do
    [ -f "$d/card.js" ] || continue
    MODELS+=("$(basename "$d")")
    case "$(basename "$d")" in
        standard)  echo -e "  ${PURPLE}[$((${#MODELS[@]}))]${NC} ${BOLD}Standard${NC} ${DIM}- Horizontal card with image + details (original)${NC}" ;;
        vertical)  echo -e "  ${PURPLE}[$((${#MODELS[@]}))]${NC} ${BOLD}Vertical${NC} ${DIM}- Centered image above text, tall cards${NC}" ;;
        minimal)   echo -e "  ${PURPLE}[$((${#MODELS[@]}))]${NC} ${BOLD}Minimal${NC} ${DIM}- Compact list-style rows, fast browsing${NC}" ;;
        magazine)  echo -e "  ${PURPLE}[$((${#MODELS[@]}))]${NC} ${BOLD}Magazine${NC} ${DIM}- Large editorial cards with full descriptions${NC}" ;;
        *)         echo -e "  ${PURPLE}[$((${#MODELS[@]}))]${NC} ${BOLD}$(basename "$d")${NC}" ;;
    esac
done
echo ""
read -p "  Choose model [1-${#MODELS[@]}] (default: 1): " MODEL_CHOICE
MODEL_CHOICE="${MODEL_CHOICE:-1}"
if [[ "$MODEL_CHOICE" -lt 1 || "$MODEL_CHOICE" -gt "${#MODELS[@]}" ]]; then
    MODEL_CHOICE=1
fi
SELECTED_MODEL="${MODELS[$((MODEL_CHOICE-1))]}"
echo -e "  ${GREEN}OK${NC} Selected: ${BOLD}${SELECTED_MODEL}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 6: Content Selection (Categories)
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 6/8: Select Content (Product Categories) ---${NC}"
echo ""
echo -e "  ${DIM}Choose how to set up your product categories:${NC}"
echo -e "  ${GREEN}[a]${NC} ${BOLD}All categories${NC} ${DIM}- Include every category from products.json${NC}"
echo -e "  ${GREEN}[s]${NC} ${BOLD}Select from existing${NC} ${DIM}- Pick specific categories by number${NC}"
echo -e "  ${YELLOW}[c]${NC} ${BOLD}Custom categories${NC} ${DIM}- Type your own category names${NC}"
echo ""
read -p "  Choose [a/s/c] (default: a): " CAT_MODE
CAT_MODE="${CAT_MODE:-a}"
CAT_MODE=$(echo "$CAT_MODE" | tr '[:upper:]' '[:lower:]')

SELECTED_CATEGORIES="all"
CUSTOM_CAT_NAMES=""

if [[ "$CAT_MODE" == "s" ]]; then
    # --- Select from existing categories ---
    CATEGORIES=()
    if [ -f "${SCRIPT_DIR}/data/products.json" ]; then
        while IFS= read -r line; do
            slug=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('slug',''))" 2>/dev/null)
            label=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('label',''))" 2>/dev/null)
            emoji=$(echo "$line" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('emoji',''))" 2>/dev/null)
            count=$(python3 -c "import json; d=json.load(open('${SCRIPT_DIR}/data/products.json')); print(len([p for p in d['products'] if p['category']=='$slug']))" 2>/dev/null || echo "?")
            if [ -n "$slug" ]; then
                CATEGORIES+=("$slug")
                echo -e "  ${CYAN}[$((${#CATEGORIES[@]}))]${NC} ${emoji} ${BOLD}${label}${NC} ${DIM}(${count} products)${NC}"
            fi
        done < <(python3 -c "import json; d=json.load(open('${SCRIPT_DIR}/data/products.json')); [print(json.dumps(c)) for c in d['categories']]" 2>/dev/null)
    fi
    echo ""
    echo -e "  ${DIM}Type numbers separated by spaces (e.g. 1 3 5)${NC}"
    read -p "  Select categories [1-${#CATEGORIES[@]}] (default: all): " CAT_INPUT
    CAT_INPUT="${CAT_INPUT:-all}"

    if [[ "$CAT_INPUT" != "all" && "$CAT_INPUT" != "" ]]; then
        SELECTED_CATEGORIES=""
        for num in $CAT_INPUT; do
            if [[ "$num" -ge 1 && "$num" -le "${#CATEGORIES[@]}" ]]; then
                idx=$((num-1))
                if [ -z "$SELECTED_CATEGORIES" ]; then
                    SELECTED_CATEGORIES="${CATEGORIES[$idx]}"
                else
                    SELECTED_CATEGORIES="${SELECTED_CATEGORIES},${CATEGORIES[$idx]}"
                fi
            fi
        done
        [ -z "$SELECTED_CATEGORIES" ] && SELECTED_CATEGORIES="all"
    fi
    echo -e "  ${GREEN}OK${NC} Selected: ${BOLD}${SELECTED_CATEGORIES}${NC}"

elif [[ "$CAT_MODE" == "c" ]]; then
    # --- Custom categories ---
    echo ""
    echo -e "  ${BOLD}${YELLOW}=== Custom Category Builder ===${NC}"
    echo ""
    read -p "  How many categories do you want? (1-20, default: 4): " NUM_CATS
    NUM_CATS="${NUM_CATS:-4}"
    # Validate it's a number
    if ! [[ "$NUM_CATS" =~ ^[0-9]+$ ]] || [ "$NUM_CATS" -lt 1 ]; then
        NUM_CATS=4
    fi
    if [ "$NUM_CATS" -gt 20 ]; then
        NUM_CATS=20
    fi

    CUSTOM_CAT_SLUGS=""
    DEFAULT_EMOJIS=("🌿" "🧴" "🫧" "🌱" "🪴" "🍯" "🧂" "🍄" "🫚" "🌺" "🍋" "🌶️" "🥜" "🌰" "🪷" "🫒" "🌰" "🌿" "🧄" "🥬")

    for i in $(seq 1 $NUM_CATS); do
        DEF_EMOJI="${DEFAULT_EMOJIS[$((i-1))]}"
        read -p "  Category $i name (e.g. Herbs): " CAT_NAME
        CAT_NAME="${CAT_NAME:-Category $i}"
        read -p "  Category $i emoji (default: ${DEF_EMOJI}): " CAT_EMOJI
        CAT_EMOJI="${CAT_EMOJI:-${DEF_EMOJI}}"
        # Generate slug from name
        CAT_SLUG=$(echo "$CAT_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
        # Build JSON entry: {"slug":"...","label":"...","emoji":"...","icon":"sprout","description":"..."}
        CAT_JSON="{\"slug\":\"${CAT_SLUG}\",\"label\":\"${CAT_NAME}\",\"emoji\":\"${CAT_EMOJI}\",\"icon\":\"sprout\",\"description\":\"Browse our ${CAT_NAME} collection\"}"
        if [ -z "$CUSTOM_CAT_NAMES" ]; then
            CUSTOM_CAT_NAMES="$CAT_JSON"
        else
            CUSTOM_CAT_NAMES="${CUSTOM_CAT_NAMES}|${CAT_JSON}"
        fi
        if [ -z "$CUSTOM_CAT_SLUGS" ]; then
            CUSTOM_CAT_SLUGS="$CAT_SLUG"
        else
            CUSTOM_CAT_SLUGS="${CUSTOM_CAT_SLUGS},${CAT_SLUG}"
        fi
        echo -e "    ${GREEN}✓${NC} Added: ${CAT_EMOJI} ${CAT_NAME} (${CAT_SLUG})"
    done
    SELECTED_CATEGORIES="custom:${CUSTOM_CAT_SLUGS}"
    echo -e ""
    echo -e "  ${GREEN}OK${NC} Created ${NUM_CATS} custom categories"
else
    echo -e "  ${GREEN}OK${NC} All categories selected"
fi
echo ""

# -----------------------------------------------------------------------------
# Step 7: Features Toggle
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 7/8: Toggle Features ---${NC}"
echo ""
echo -e "  ${DIM}Enable or disable site features. Press Y or Enter for yes, N for no.${NC}"
echo ""

FEATURES={}

# Cart (always core, but can disable)
read -p "  [1] Shopping Cart & Checkout? [Y/n]: " FEAT_CART
FEAT_CART="${FEAT_CART:-Y}"
[[ "$FEAT_CART" =~ ^[Yy]$ ]] && FEATURES[cart]="on" || FEATURES[cart]="off"

# Auth
read -p "  [2] User Authentication (login/signup)? [Y/n]: " FEAT_AUTH
FEAT_AUTH="${FEAT_AUTH:-Y}"
[[ "$FEAT_AUTH" =~ ^[Yy]$ ]] && FEATURES[auth]="on" || FEATURES[auth]="off"

# Blog
read -p "  [3] Blog System? [Y/n]: " FEAT_BLOG
FEAT_BLOG="${FEAT_BLOG:-Y}"
[[ "$FEAT_BLOG" =~ ^[Yy]$ ]] && FEATURES[blog]="on" || FEATURES[blog]="off"

# Inquiry
read -p "  [4] Inquiry / Contact Form? [Y/n]: " FEAT_INQUIRY
FEAT_INQUIRY="${FEAT_INQUIRY:-Y}"
[[ "$FEAT_INQUIRY" =~ ^[Yy]$ ]] && FEATURES[inquiry]="on" || FEATURES[inquiry]="off"

echo ""
echo -e "  Features: Cart=${FEATURES[cart]} | Auth=${FEATURES[auth]} | Blog=${FEATURES[blog]} | Inquiry=${FEATURES[inquiry]}"
echo ""

# -----------------------------------------------------------------------------
# Step 8: Output Location
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 8/8: Output Location ---${NC}"
echo ""
DEFAULT_OUTPUT="${HOME}/Desktop/${PROJECT_NAME}-site"
read -p "  Output directory [${DEFAULT_OUTPUT}]: " OUTPUT_DIR
OUTPUT_DIR="${OUTPUT_DIR:-${DEFAULT_OUTPUT}}"
echo -e "  ${GREEN}OK${NC} Output: ${BOLD}${OUTPUT_DIR}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}================================================================${NC}"
echo -e "${BOLD}${CYAN}                    BUILD SUMMARY${NC}"
echo -e "${BOLD}${CYAN}================================================================${NC}"
echo ""
echo -e "  Site Name:     ${BOLD}${SITE_NAME}${NC}"
echo -e "  Project:       ${DIM}${PROJECT_NAME}${NC}"
echo -e "  Email:         ${CONTACT_EMAIL}"
echo -e "  Phone:         ${CONTACT_PHONE}"
echo -e "  Location:      ${CITY}, ${PROVINCE}, ${COUNTRY}"
echo ""
echo -e "  Theme:         ${GREEN}${SELECTED_THEME}${NC}"
echo -e "  Style:         ${BLUE}${SELECTED_STYLE}${NC}"
echo -e "  Icons:         ${YELLOW}${SELECTED_ICONS}${NC}"
echo -e "  Card Model:    ${PURPLE}${SELECTED_MODEL}${NC}"
echo -e "  Categories:    ${CYAN}${SELECTED_CATEGORIES}${NC}"
echo -e "  Features:      Cart=${FEATURES[cart]} Auth=${FEATURES[auth]} Blog=${FEATURES[blog]} Inquiry=${FEATURES[inquiry]}"
echo ""
echo -e "  Output:        ${BOLD}${OUTPUT_DIR}${NC}"
echo ""

read -p "  Generate site? [Y/n]: " CONFIRM
CONFIRM="${CONFIRM:-Y}"

if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    # Write build config JSON
    cat > "$BUILD_CONFIG" << EOF
{
  "theme": "${SELECTED_THEME}",
  "custom_theme": "${CUSTOM_THEME}",
  "style": "${SELECTED_STYLE}",
  "icons": "${SELECTED_ICONS}",
  "model": "${SELECTED_MODEL}",
  "categories": "${SELECTED_CATEGORIES}",
  "custom_category_names": "${CUSTOM_CAT_NAMES}",
  "output_dir": "${OUTPUT_DIR}",
  "features": {
    "cart": "${FEATURES[cart]}",
    "auth": "${FEATURES[auth]}",
    "blog": "${FEATURES[blog]}",
    "inquiry": "${FEATURES[inquiry]}"
  },
  "site": {
    "site_name": "${SITE_NAME}",
    "site_tagline": "${SITE_TAGLINE}",
    "site_copyright": "(c) $(date +%Y) ${SITE_NAME}. All rights reserved.",
    "contact_email": "${CONTACT_EMAIL}",
    "contact_phone": "${CONTACT_PHONE}",
    "city": "${CITY}",
    "province": "${PROVINCE}",
    "country": "${COUNTRY}",
    "currency": "USD",
    "exchange_rate": "${EXCHANGE_RATE}",
    "admin_email": "${CONTACT_EMAIL}",
    "project_name": "${PROJECT_NAME}"
  }
}
EOF

    echo ""
    echo -e "${BOLD}Generating...${NC}"
    echo ""

    # Run generator
    if python3 "$GENERATOR" "$BUILD_CONFIG"; then
        echo ""
        echo -e "${GREEN}${BOLD}SUCCESS!${NC}"
        echo ""
        echo -e "  Your new site is ready at:"
        echo -e "  ${BOLD}${OUTPUT_DIR}${NC}"
        echo ""
        echo -e "  ${DIM}To preview locally:${NC}"
        echo -e "    cd ${OUTPUT_DIR} && npx wrangler pages dev ."
        echo ""
        echo -e "  ${DIM}To deploy to Cloudflare Pages:${NC}"
        echo -e "    cd ${OUTPUT_DIR} && wrangler pages deploy . --project-name=${PROJECT_NAME}"
        echo ""
    else
        echo -e "${RED}${BOLD}Generation failed! Check errors above.${NC}"
        exit 1
    fi

    # Cleanup
    rm -f "$BUILD_CONFIG"
    rm -f "${SCRIPT_DIR}/.custom-theme.json"
else
    echo ""
    echo -e "  ${YELLOW}Cancelled.${NC}"
fi
