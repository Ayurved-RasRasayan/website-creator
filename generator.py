#!/usr/bin/env python3
"""
Site Generator Engine - Called by 1.sh
Reads user choices and generates a complete working website.
"""

import json
import os
import re
import shutil
import sys

MASTER_DIR = os.path.dirname(os.path.abspath(__file__))


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_text(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def build_tailwind_colors(theme):
    """Build the tailwind.config colors block from theme JSON."""
    lines = []
    for color_name, shades in theme['tailwind'].items():
        shade_entries = ', '.join(f'\'{k}\': \'{v}\'' for k, v in shades.items())
        lines.append(f'                        {color_name}: {{\n                            {shade_entries},\n                        }}')
    return ',\n'.join(lines)


def get_icon_replacements(icon_pack_dir):
    """Return (cdn_html, mapping_dict, icon_mode, icon_init_code)."""
    mapping = load_json(os.path.join(icon_pack_dir, 'mapping.json'))
    cdn_html = load_text(os.path.join(icon_pack_dir, 'cdn.html')).strip()
    pack_name = os.path.basename(icon_pack_dir)

    if pack_name == 'lucide':
        return cdn_html, mapping, 'lucide', 'lucide.createIcons()'
    elif pack_name == 'fontawesome':
        return cdn_html, mapping, 'fontawesome', ''
    elif pack_name == 'heroicons':
        return cdn_html, mapping, 'heroicons', ''
    elif pack_name == 'emoji':
        return cdn_html, mapping, 'emoji', ''
    return cdn_html, mapping, 'lucide', 'lucide.createIcons()'


def render_icon_tag(icon_name, class_names, icon_mode, mapping):
    """Generate HTML for an icon based on the icon pack mode."""
    if icon_mode == 'lucide':
        return f'<i data-lucide="{icon_name}" class="{class_names}"></i>'
    elif icon_mode == 'fontawesome':
        fa_class = mapping.get(icon_name, 'fa-solid fa-circle')
        return f'<i class="{fa_class} {class_names}"></i>'
    elif icon_mode == 'emoji':
        emoji = mapping.get(icon_name, '\u2753')
        return f'<span class="{class_names} inline-flex items-center justify-center">{emoji}</span>'
    elif icon_mode == 'heroicons':
        svg = mapping.get(icon_name, mapping.get('sprout', ''))
        # Adjust class in SVG
        if class_names:
            svg = re.sub(r'class="([^"]*)"', f'class="{class_names}"', svg)
        return svg
    return f'<i data-lucide="{icon_name}" class="{class_names}"></i>'


def replace_icons_in_html(html, icon_mode, mapping):
    """Replace data-lucide=\"X\" icon references in HTML.
    The HTML has pre-rendered Lucide SVGs: <svg ... data-lucide=\"X\" class=\"lucide lucide-X ...\"><path ...></svg>
    Also handles <i data-lucide=\"X\" class=\"Y\"></i> patterns.
    """
    if icon_mode == 'lucide':
        # Still replace SVGs back to <i> tags so lucide.createIcons() can re-render
        def svg_to_i_tag(match):
            icon_name = match.group(1)
            full_svg = match.group(0)
            class_match = re.search(r'class="([^"]*?)"', full_svg)
            # Extract utility classes (exclude lucide-specific ones)
            if class_match:
                all_classes = class_match.group(1).split()
                util_classes = [c for c in all_classes if not c.startswith('lucide')]
                classes = ' '.join(util_classes)
            else:
                classes = 'w-6 h-6'
            return f'<i data-lucide="{icon_name}" class="{classes}"></i>'

        html = re.sub(
            r'<svg[^>]*data-lucide="([^"]+)"[^>]*>(?:(?!</svg>).)*</svg>',
            svg_to_i_tag, html, flags=re.DOTALL
        )
        return html

    # For non-lucide modes: replace SVGs with the chosen icon library
    def replace_svg_icon(match):
        icon_name = match.group(1)
        full_svg = match.group(0)
        class_match = re.search(r'class="([^"]*?)"', full_svg)
        if class_match:
            all_classes = class_match.group(1).split()
            util_classes = [c for c in all_classes if not c.startswith('lucide')]
            classes = ' '.join(util_classes)
        else:
            classes = 'w-6 h-6'
        return render_icon_tag(icon_name, classes, icon_mode, mapping)

    # Match SVG icons with data-lucide attribute
    html = re.sub(
        r'<svg[^>]*data-lucide="([^"]+)"[^>]*>(?:(?!</svg>).)*</svg>',
        replace_svg_icon, html, flags=re.DOTALL
    )

    # Also handle <i data-lucide="X"> patterns (in case any exist)
    def replace_i_tag(match):
        icon_name = match.group(1)
        full_tag = match.group(0)
        class_match = re.search(r'class="([^"]*)"', full_tag)
        classes = class_match.group(1) if class_match else 'w-6 h-6'
        return render_icon_tag(icon_name, classes, icon_mode, mapping)

    html = re.sub(r'<i\s+data-lucide="([^"]+)"[^>]*>', replace_i_tag, html)
    return html


def replace_icons_in_js(js_code, icon_mode, mapping):
    """Replace icon references in JS code (data-lucide attributes, lucide.createIcons())."""
    if icon_mode == 'lucide':
        return js_code

    # Replace <i data-lucide="X" class="Y"></i> patterns in JS template literals
    def replace_lucide_tag(match):
        icon_name = match.group(1)
        full_tag = match.group(0)
        class_match = re.search(r'class="([^"]*)"', full_tag)
        classes = class_match.group(1) if class_match else 'w-6 h-6'
        return render_icon_tag(icon_name, classes, icon_mode, mapping)

    js_code = re.sub(r'<i\s+data-lucide="([^"]+)"[^>]*>', replace_lucide_tag, js_code)
    return js_code


def replace_icon_tag_markers(content, icon_mode, mapping):
    """Replace %%ICON_TAG name classes%% markers in model templates."""
    def replace_marker(match):
        icon_name = match.group(1).split()[0]
        classes = ' '.join(match.group(1).split()[1:])
        return render_icon_tag(icon_name, classes, icon_mode, mapping)

    content = re.sub(r'%%ICON_TAG\s+([\w-]+\s+[\w\s-]+)%%', replace_marker, content)
    return content


def replace_icon_refresh(content, icon_init_code):
    """Replace %%ICON_REFRESH%% markers."""
    return content.replace('%%ICON_REFRESH%%', icon_init_code)


def apply_theme_to_html(html, theme):
    """Replace tailwind color config in index.html."""
    colors_block = build_tailwind_colors(theme)
    # Find and replace the colors block in tailwind config
    pattern = r'(colors:\s*\{)\s*emerald:\s*\{[^}]+\}[\s\S]*?amber:\s*\{[^}]+\}'
    replacement = f'\\1\n                            {colors_block}'
    html = re.sub(pattern, replacement, html)
    return html


def apply_theme_to_css(css, theme):
    """Replace hardcoded color values in styles.css."""
    c = theme['css']

    # Body
    css = re.sub(r'background-color:\s*#[A-Fa-f0-9]+;', f'background-color: {c["body_bg"]};', css)
    css = re.sub(r'color:\s*#[A-Fa-f0-9]+;', f'color: {c["body_text"]};', css, count=1)

    # Background image
    if c['bg_image'] == 'none':
        css = re.sub(r"background-image:\s*url\([^)]+\);", 'background-image: none;', css)
        css = css.replace('background-repeat: repeat;', 'background-repeat: no-repeat;')
        css = re.sub(r'background-size:\s*[0-9px\s]+;', 'background-size: auto;', css)
    else:
        css = re.sub(r"background-image:\s*url\([^)]+\);", f'background-image: {c["bg_image"]};', css)

    # Scrollbar thumb
    css = re.sub(
        r'(::-webkit-scrollbar-thumb\s*\{[^}]*?)background:\s*#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + f'background: {c["scrollbar"]};', css)
    # Scrollbar thumb hover
    css = re.sub(
        r'(::-webkit-scrollbar-thumb:hover\s*\{[^}]*?)background:\s*#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + f'background: {c["scrollbar_hover"]};', css)

    # Gradient text
    css = re.sub(r'linear-gradient\(135deg,\s*#[A-Fa-f0-9]+,\s*#[A-Fa-f0-9]+,\s*#[A-Fa-f0-9]+\)',
        f'linear-gradient(135deg, {c["gradient_start"]}, {c["gradient_mid"]}, {c["gradient_end"]})', css)

    # Category button active - bg
    pat = r'(\.category-btn\.active\s*\{[^}]*?)background-color:\s*#[A-Fa-f0-9]+;'
    css = re.sub(pat,
        lambda m: m.group(1) + 'background-color: ' + c['category_active_bg'] + ';', css)
    # Category button active - color
    css = re.sub(
        r'(\.category-btn\.active\s*\{[^}]*?)color:\s*#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + 'color: ' + c['category_active_text'] + ';', css)
    # Category button not active - color
    css = re.sub(
        r'(\.category-btn:not\(\.active\)\s*\{[^}]*?)color:\s*#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + 'color: ' + c['category_text'] + ';', css)
    # Category button not active hover - bg
    css = re.sub(
        r'(\.category-btn:not\(\.active\):hover\s*\{[^}]*?)background-color:\s*#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + 'background-color: ' + c['category_hover_bg'] + ';', css)

    # Skeleton
    css = re.sub(r'background:\s*linear-gradient\(90deg,\s*#[A-Fa-f0-9]+\s*25%,\s*#[A-Fa-f0-9]+\s*50%,\s*#[A-Fa-f0-9]+\s*75%\)',
        f'background: linear-gradient(90deg, {c["skeleton_start"]} 25%, {c["skeleton_mid"]} 50%, {c["skeleton_start"]} 75%)', css)

    # Ring/outline colors in card selects
    ring_color = c['category_active_bg'].lstrip('#')
    css = re.sub(
        r'(ring:\s*1px\s*solid\s*)#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + '#' + ring_color + ';', css)
    css = re.sub(
        r'(focus:ring[^;]*?)#[A-Fa-f0-9]+;',
        lambda m: m.group(1) + '#' + ring_color + ';', css)

    # Card shadow
    rgba_val = c['card_shadow_rgba']
    css = re.sub(r'box-shadow:\s*0\s+10px\s+25px\s*-5px\s*rgba\([^)]+\)',
        f'box-shadow: 0 10px 25px -5px rgba({rgba_val}, 0.1)', css)
    css = re.sub(r'0\s+8px\s+10px\s*-6px\s*rgba\([^)]+\)',
        f'0 8px 10px -6px rgba({rgba_val}, 0.05)', css)

    # Toast - in ui.js Toast.show(), not in styles.css, skip
    # The toast uses Tailwind classes so theme colors handle it

    return css

def apply_style_to_css(css, style_config, overrides_css):
    """Apply style-specific overrides to CSS."""
    # Replace font family in the base * selector
    css = re.sub(r"font-family:\s*[^;]+;", f'font-family: {style_config["font_family"]};', css, count=1)
    return css + '\n\n/* === Style: ' + style_config['name'] + ' === */\n' + overrides_css


def inject_card_modal_into_ui(ui_js, model_dir, icon_mode, mapping):
    """Replace renderProductCard and openProductModal in ui.js template."""
    card_js = load_text(os.path.join(model_dir, 'card.js'))
    modal_js = load_text(os.path.join(model_dir, 'modal.js'))

    # Replace renderProductCard method
    pattern_card = r'(renderProductCard\(p\)\s*\{)[\s\S]*?^(    \},)'
    # Use a simpler approach: find the function boundaries
    card_start = ui_js.find('renderProductCard(p) {')
    if card_start == -1:
        print('ERROR: Could not find renderProductCard in ui.js template')
        sys.exit(1)

    # Find the matching closing - count braces
    brace_count = 0
    started = False
    card_end = card_start
    for i in range(card_start, len(ui_js)):
        if ui_js[i] == '{':
            brace_count += 1
            started = True
        elif ui_js[i] == '}':
            brace_count -= 1
            if started and brace_count == 0:
                card_end = i + 1
                break

    ui_js = ui_js[:card_start] + card_js.rstrip() + '\n' + ui_js[card_end:]

    # Replace openProductModal method
    modal_start = ui_js.find('openProductModal(productId) {')
    if modal_start == -1:
        print('ERROR: Could not find openProductModal in ui.js template')
        sys.exit(1)

    brace_count = 0
    started = False
    modal_end = modal_start
    for i in range(modal_start, len(ui_js)):
        if ui_js[i] == '{':
            brace_count += 1
            started = True
        elif ui_js[i] == '}':
            brace_count -= 1
            if started and brace_count == 0:
                modal_end = i + 1
                break

    ui_js = ui_js[:modal_start] + modal_js.rstrip() + '\n' + ui_js[modal_end:]

    # Apply icon replacements in the injected code
    ui_js = replace_icons_in_js(ui_js, icon_mode, mapping)
    ui_js = replace_icon_tag_markers(ui_js, icon_mode, mapping)

    return ui_js


def apply_icons_to_html(html, icon_mode, mapping, cdn_html):
    """Replace icon CDN and data-lucide references in HTML."""
    # Replace Lucide CDN with chosen icon CDN
    html = re.sub(r'<script src="https://unpkg\.com/lucide@latest"></script>', cdn_html, html)

    # Replace data-lucide icon references in HTML
    html = replace_icons_in_html(html, icon_mode, mapping)

    return html


def apply_font_to_html(html, style_config):
    """Replace Google Fonts link in HTML."""
    html = re.sub(
        r'<link href="https://fonts\.googleapis\.com/css2\?[^"]+" rel="stylesheet">',
        f'<link href="{style_config["font_link"]}" rel="stylesheet">',
        html
    )
    return html


def apply_icons_to_app_js(app_js, icon_mode, mapping, icon_init):
    """Replace icon references in app.js."""
    app_js = replace_icons_in_js(app_js, icon_mode, mapping)

    # Replace lucide.createIcons() calls
    if icon_mode != 'lucide':
        app_js = app_js.replace('lucide.createIcons();', '')
        # Remove the line entirely if empty
        app_js = re.sub(r'\n\s*// \d+\. Initialize.*?icons\n\s*$', '\n', app_js)
    return app_js


def apply_icons_to_ui_js(ui_js, icon_mode, mapping, icon_init):
    """Replace remaining lucide.createIcons() in ui.js."""
    if icon_mode != 'lucide':
        ui_js = ui_js.replace('lucide.createIcons();', '')
    return ui_js


def generate_wrangler_toml(output_dir, site_config):
    """Generate wrangler.toml with user's site config."""
    content = f"""# =============================================================================
# Cloudflare Pages Configuration
# Auto-generated by Site Generator
# =============================================================================

name = "{site_config['project_name']}"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "<place your uuid here>"

[[d1_databases]]
binding = "DB1"
database_name = "users-db"
database_id = "<place your uuid here>"

[vars]
SITE_NAME = "{site_config['site_name']}"
SITE_TAGLINE = "{site_config['site_tagline']}"
SITE_COPYRIGHT = "{site_config['site_copyright']}"
CONTACT_EMAIL = "{site_config['contact_email']}"
CONTACT_PHONE = "{site_config['contact_phone']}"
ADDRESS_CITY = "{site_config['city']}"
ADDRESS_PROVINCE = "{site_config['province']}"
ADDRESS_COUNTRY = "{site_config['country']}"
DEFAULT_CURRENCY = "{site_config['currency']}"
EXCHANGE_RATE_TO_NPR = "{site_config['exchange_rate']}"
ADMIN_EMAIL = "{site_config['admin_email']}"
ALLOWED_ORIGINS = https://your-actual-domain.pages.dev
"""
    write_text(os.path.join(output_dir, 'wrangler.toml'), content)


def generate_site(choices, output_dir):
    """Main generation function."""
    theme_name = choices['theme']
    style_name = choices['style']
    icon_name = choices['icons']
    model_name = choices['model']
    site_config = choices['site']

    print(f"\n  Theme:   {theme_name}")
    print(f"  Style:   {style_name}")
    print(f"  Icons:   {icon_name}")
    print(f"  Model:   {model_name}")
    print(f"  Output:  {output_dir}")

    # Load configs
    theme = load_json(os.path.join(MASTER_DIR, 'themes', f'{theme_name}.json'))
    style_config = load_json(os.path.join(MASTER_DIR, 'styles', style_name, 'config.json'))
    style_overrides = load_text(os.path.join(MASTER_DIR, 'styles', style_name, 'overrides.css'))
    icon_pack_dir = os.path.join(MASTER_DIR, 'icons', icon_name)
    model_dir = os.path.join(MASTER_DIR, 'models', model_name)

    cdn_html, icon_mapping, icon_mode, icon_init = get_icon_replacements(icon_pack_dir)

    # Clean output dir
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)

    # Copy static assets (images, data, functions, etc.)
    for item in ['images', 'data', 'functions', '_headers', '_redirects', 'robots.txt',
                 'css/mobile-form-fix.css', 'js/config.js', 'js/data.js', 'js/cart.js',
                 'js/checkout.js', 'js/auth.js', 'js/blog.js', 'js/inquiry.js',
                 'js/mobile-form-fix.js', 'package.json']:
        src = os.path.join(MASTER_DIR, item)
        dst = os.path.join(output_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        elif os.path.isfile(src):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)

    # --- Generate index.html ---
    print("  [1/6] Generating index.html...")
    html = load_text(os.path.join(MASTER_DIR, 'templates', 'index.html.tpl'))
    html = apply_theme_to_html(html, theme)
    html = apply_font_to_html(html, style_config)
    html = apply_icons_to_html(html, icon_mode, icon_mapping, cdn_html)
    write_text(os.path.join(output_dir, 'index.html'), html)

    # --- Generate styles.css ---
    print("  [2/6] Generating styles.css...")
    css = load_text(os.path.join(MASTER_DIR, 'templates', 'styles.css.tpl'))
    css = apply_theme_to_css(css, theme)
    css = apply_style_to_css(css, style_config, style_overrides)
    write_text(os.path.join(output_dir, 'css', 'styles.css'), css)

    # --- Generate ui.js ---
    print("  [3/6] Generating ui.js...")
    ui_js = load_text(os.path.join(MASTER_DIR, 'templates', 'ui.js.tpl'))
    ui_js = inject_card_modal_into_ui(ui_js, model_dir, icon_mode, icon_mapping)
    ui_js = apply_icons_to_ui_js(ui_js, icon_mode, icon_mapping, icon_init)
    ui_js = replace_icon_refresh(ui_js, icon_init)
    write_text(os.path.join(output_dir, 'js', 'ui.js'), ui_js)

    # --- Generate app.js ---
    print("  [4/6] Generating app.js...")
    app_js = load_text(os.path.join(MASTER_DIR, 'templates', 'app.js.tpl'))
    app_js = apply_icons_to_app_js(app_js, icon_mode, icon_mapping, icon_init)
    write_text(os.path.join(output_dir, 'js', 'app.js'), app_js)

    # --- Generate wrangler.toml ---
    print("  [5/6] Generating wrangler.toml...")
    generate_wrangler_toml(output_dir, site_config)

    # --- Copy remaining JS files ---
    print("  [6/6] Copying supporting files...")

    print(f"\n  Site generated successfully!")
    return True


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: python3 generator.py <build-config.json>')
        sys.exit(1)

    config_path = sys.argv[1]
    choices = load_json(config_path)
    output_dir = choices.get('output_dir', os.path.expanduser('~/Desktop/generated-site'))

    success = generate_site(choices, output_dir)
    if success:
        print(f"\n  Deploy with: cd {output_dir} && wrangler pages deploy . --project-name={choices['site']['project_name']}")
