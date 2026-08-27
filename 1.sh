#!/usr/bin/env bash
# =============================================================================
# Site Generator - Interactive Menu
# Creates a new website from the master template with custom
# theme, style, icons, and card model.
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

# Simple fallbacks
ICON_CHECK="OK" ICON_ARROW="->" ICON_STAR="*"

clear
echo ""
echo -e "${BOLD}${CYAN}========================================================${NC}"
echo -e "${BOLD}${CYAN}          WEBSITE GENERATOR - Master Template${NC}"
echo -e "${BOLD}${CYAN}========================================================${NC}"
echo ""
echo -e "  This tool generates a complete, deploy-ready website"
echo -e "  from the master template with your chosen customizations."
echo ""
echo -e "  ${DIM}Your existing site files are never modified.${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Site Name
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 1: Site Identity ---${NC}"
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

# Project name for Cloudflare (slugified)
PROJECT_NAME=$(echo "$SITE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-')
echo ""
echo -e "  ${DIM}Cloudflare project name: ${PROJECT_NAME}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 2: Theme Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 2: Select Theme (Color Palette) ---${NC}"
echo ""
THEMES=()
for f in "${SCRIPT_DIR}"/themes/*.json; do
    slug=$(basename "$f" .json)
    name=$(python3 -c "import json; print(json.load(open('$f'))['name'])" 2>/dev/null || "$slug")
    desc=$(python3 -c "import json; print(json.load(open('$f'))['description'])" 2>/dev/null || "")
    THEMES+=("$slug")
    echo -e "  ${GREEN}[$((${#THEMES[@]}))]${NC} ${BOLD}${name}${NC} ${DIM}- ${desc}${NC}"
done
echo ""
read -p "  Choose theme [1-${#THEMES[@]}] (default: 1): " THEME_CHOICE
THEME_CHOICE="${THEME_CHOICE:-1}"
if [[ "$THEME_CHOICE" -lt 1 || "$THEME_CHOICE" -gt "${#THEMES[@]}" ]]; then
    THEME_CHOICE=1
fi
SELECTED_THEME="${THEMES[$((THEME_CHOICE-1))]%.json}"
echo -e "  ${ICON_CHECK} Selected: ${BOLD}${SELECTED_THEME}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Style Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 3: Select Style (Typography + Layout) ---${NC}"
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
echo -e "  ${ICON_CHECK} Selected: ${BOLD}${SELECTED_STYLE}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Icon Pack Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 4: Select Icon Pack ---${NC}"
echo ""
ICONS=()
for d in "${SCRIPT_DIR}"/icons/*/; do
    [ -f "$d/mapping.json" ] || continue
    ICONS+=("$(basename "$d")")
    case "$(basename "$d")" in
        lucide)     echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Lucide${NC} ${DIM}- Clean line icons (original default)${NC}" ;;
        fontawesome) echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Font Awesome 6${NC} ${DIM}- Classic icon font, huge library${NC}" ;;
        heroicons)  echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Heroicons${NC} ${DIM}- Modern SVG icons by Tailwind team${NC}" ;;
        emoji)      echo -e "  ${YELLOW}[$((${#ICONS[@]}))]${NC} ${BOLD}Emoji Only${NC} ${DIM}- No library, pure emoji fallbacks${NC}" ;;
    esac
done
echo ""
read -p "  Choose icons [1-${#ICONS[@]}] (default: 1): " ICON_CHOICE
ICON_CHOICE="${ICON_CHOICE:-1}"
if [[ "$ICON_CHOICE" -lt 1 || "$ICON_CHOICE" -gt "${#ICONS[@]}" ]]; then
    ICON_CHOICE=1
fi
SELECTED_ICONS="${ICONS[$((ICON_CHOICE-1))]}"
echo -e "  ${ICON_CHECK} Selected: ${BOLD}${SELECTED_ICONS}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 5: Card Model Selection
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 5: Select Card Model (Product Card Layout) ---${NC}"
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
    esac
done
echo ""
read -p "  Choose model [1-${#MODELS[@]}] (default: 1): " MODEL_CHOICE
MODEL_CHOICE="${MODEL_CHOICE:-1}"
if [[ "$MODEL_CHOICE" -lt 1 || "$MODEL_CHOICE" -gt "${#MODELS[@]}" ]]; then
    MODEL_CHOICE=1
fi
SELECTED_MODEL="${MODELS[$((MODEL_CHOICE-1))]}"
echo -e "  ${ICON_CHECK} Selected: ${BOLD}${SELECTED_MODEL}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 6: Output Location
# -----------------------------------------------------------------------------
echo -e "${BOLD}--- Step 6: Output Location ---${NC}"
echo ""
DEFAULT_OUTPUT="${HOME}/Desktop/${PROJECT_NAME}-site"
read -p "  Output directory [${DEFAULT_OUTPUT}]: " OUTPUT_DIR
OUTPUT_DIR="${OUTPUT_DIR:-${DEFAULT_OUTPUT}}"
echo -e "  ${ICON_CHECK} Output: ${BOLD}${OUTPUT_DIR}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}========================================================${NC}"
echo -e "${BOLD}${CYAN}                  BUILD SUMMARY${NC}"
echo -e "${BOLD}${CYAN}========================================================${NC}"
echo ""
echo -e "  Site Name:     ${BOLD}${SITE_NAME}${NC}"
echo -e "  Project Name:  ${DIM}${PROJECT_NAME}${NC}"
echo -e "  Email:         ${CONTACT_EMAIL}"
echo -e "  Phone:         ${CONTACT_PHONE}"
echo -e "  Location:      ${CITY}, ${PROVINCE}, ${COUNTRY}"
echo ""
echo -e "  Theme:         ${GREEN}${SELECTED_THEME}${NC}"
echo -e "  Style:         ${BLUE}${SELECTED_STYLE}${NC}"
echo -e "  Icons:         ${YELLOW}${SELECTED_ICONS}${NC}"
echo -e "  Card Model:    ${PURPLE}${SELECTED_MODEL}${NC}"
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
  "style": "${SELECTED_STYLE}",
  "icons": "${SELECTED_ICONS}",
  "model": "${SELECTED_MODEL}",
  "output_dir": "${OUTPUT_DIR}",
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
else
    echo ""
    echo -e "  ${YELLOW}Cancelled.${NC}"
fi