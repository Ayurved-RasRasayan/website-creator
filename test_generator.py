#!/usr/bin/env python3
import json
import os
import shutil
import subprocess
import sys
import unittest

import generator

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

class TestGeneratorUnit(unittest.TestCase):
    def setUp(self):
        self.test_dir = os.path.join(SCRIPT_DIR, 'test-unit-output-site')
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)
        os.makedirs(self.test_dir, exist_ok=True)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_build_tailwind_colors(self):
        theme = {
            'tailwind': {
                'emerald': {'50': '#F0FDF4', '500': '#10B981'},
                'amber': {'50': '#FFFBEB', '500': '#F59E0B'}
            }
        }
        res = generator.build_tailwind_colors(theme)
        self.assertIn("emerald: {", res)
        self.assertIn("'50': '#F0FDF4'", res)
        self.assertIn("amber: {", res)

    def test_filter_categories_custom(self):
        data_dir = os.path.join(self.test_dir, 'data')
        os.makedirs(data_dir, exist_ok=True)
        products_json = {
            'categories': [{'slug': 'old', 'label': 'Old'}],
            'products': [{'id': 1, 'category': 'old'}]
        }
        with open(os.path.join(data_dir, 'products.json'), 'w') as f:
            json.dump(products_json, f)

        custom_cat_names = '{"slug":"herbs","label":"Herbs","emoji":"🌿"}|{"slug":"oils","label":"Oils","emoji":"🧴"}'
        generator.filter_categories(self.test_dir, 'custom:herbs,oils', custom_cat_names)

        with open(os.path.join(data_dir, 'products.json'), 'r') as f:
            res = json.load(f)
        self.assertEqual(len(res['categories']), 2)
        self.assertEqual(res['categories'][0]['slug'], 'herbs')
        self.assertEqual(len(res['products']), 0)

    def test_apply_features_off(self):
        # Setup dummy directory structure
        js_dir = os.path.join(self.test_dir, 'js')
        os.makedirs(js_dir, exist_ok=True)
        for f_name in ['cart.js', 'auth.js', 'blog.js', 'inquiry.js', 'app.js']:
            with open(os.path.join(js_dir, f_name), 'w') as f:
                f.write('// dummy ' + f_name)

        with open(os.path.join(self.test_dir, 'index.html'), 'w') as f:
            f.write('<html><script src="/js/blog.js"></script><!-- === BLOG === --><section id="blog">Blog</section></html>')

        features = {'cart': 'off', 'auth': 'off', 'blog': 'off', 'inquiry': 'off'}
        generator.apply_features(self.test_dir, features)

        self.assertFalse(os.path.exists(os.path.join(js_dir, 'cart.js')))
        self.assertFalse(os.path.exists(os.path.join(js_dir, 'auth.js')))
        self.assertFalse(os.path.exists(os.path.join(js_dir, 'blog.js')))
        self.assertFalse(os.path.exists(os.path.join(js_dir, 'inquiry.js')))

        with open(os.path.join(self.test_dir, 'index.html'), 'r') as f:
            html = f.read()
        self.assertNotIn('<script src="/js/blog.js">', html)
        self.assertNotIn('id="blog"', html)

class Test1ShIntegration(unittest.TestCase):
    def run_1sh(self, inputs):
        input_str = "\n".join(inputs) + "\n"
        proc = subprocess.run(
            ['bash', os.path.join(SCRIPT_DIR, '1.sh')],
            input=input_str,
            capture_output=True,
            text=True,
            cwd=SCRIPT_DIR
        )
        return proc

    def test_default_flow(self):
        # Step 1: 8 empty lines (use defaults)
        # Step 2: 1 (theme 1)
        # Step 3: 1 (style 1)
        # Step 4: 1 (icons 1 - lucide)
        # Step 5: 1 (card model 1 - standard)
        # Step 6: a (all categories)
        # Step 7: Y Y Y Y (features)
        # Step 8: default output
        # Confirm: empty string defaults to Y
        inputs = [
            "", "", "", "", "", "", "", "", # Step 1 Site Info
            "1", # Step 2 Theme
            "1", # Step 3 Style
            "1", # Step 4 Icons
            "1", # Step 5 Model
            "a", # Step 6 Categories
            "Y", "Y", "Y", "Y", # Step 7 Features
            "", # Step 8 Output
            "" # Confirm default Y
        ]
        proc = self.run_1sh(inputs)
        self.assertEqual(proc.returncode, 0, f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
        self.assertIn("SUCCESS!", proc.stdout)

        output_dir = os.path.join(SCRIPT_DIR, 'my-store-site')
        self.assertTrue(os.path.exists(output_dir))
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'index.html')))
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'css', 'styles.css')))
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'js', 'ui.js')))
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'js', 'app.js')))
        self.assertTrue(os.path.isfile(os.path.join(output_dir, 'wrangler.toml')))

        # Cleanup
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

    def test_custom_theme_flow(self):
        # Theme choice 9 is Custom Theme
        inputs = [
            "Test Custom Site", "Tagline", "test@example.com", "+1234567890", "City", "State", "Country", "130",
            "9", "#112233", "#445566", "#778899", # Custom theme
            "2", # Style 2
            "2", # Icons 2 (fontawesome)
            "2", # Model 2 (vertical)
            "a", # Categories
            "Y", "Y", "Y", "Y", # Features
            "", # Default output
            "" # Confirm default Y
        ]
        proc = self.run_1sh(inputs)
        self.assertEqual(proc.returncode, 0, f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
        self.assertIn("SUCCESS!", proc.stdout)

        output_dir = os.path.join(SCRIPT_DIR, 'test-custom-site-site')
        self.assertTrue(os.path.exists(output_dir))

        # Cleanup
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

    def test_custom_categories_and_feature_off(self):
        # Step 6: c (custom categories)
        # 2 categories: "Organic Herbs", default emoji, "Essential Oils", 🧴
        # Features: N for blog and auth
        inputs = [
            "Custom Cats Store", "", "", "", "", "", "", "",
            "3", # Theme 3
            "3", # Style 3
            "3", # Icons 3 (heroicons)
            "3", # Model 3 (minimal)
            "c", # Step 6 Custom Categories
            "2", # 2 categories
            "Organic Herbs", "",
            "Essential Oils", "🧴",
            "Y", "N", "N", "Y", # Cart=Y, Auth=N, Blog=N, Inquiry=Y
            "", # Default output
            "" # Confirm default Y
        ]
        proc = self.run_1sh(inputs)
        self.assertEqual(proc.returncode, 0, f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
        self.assertIn("SUCCESS!", proc.stdout)

        output_dir = os.path.join(SCRIPT_DIR, 'custom-cats-store-site')
        self.assertTrue(os.path.exists(output_dir))
        self.assertFalse(os.path.exists(os.path.join(output_dir, 'js', 'auth.js')))
        self.assertFalse(os.path.exists(os.path.join(output_dir, 'js', 'blog.js')))

        # Cleanup
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

    def test_selected_existing_categories_and_emoji_icons(self):
        # Step 6: s (select existing)
        # Select category 1 and 2 ("1 2")
        inputs = [
            "Select Cat Store", "", "", "", "", "", "", "",
            "4", # Theme 4
            "1", # Style 1
            "4", # Icons 4 (emoji)
            "4", # Model 4 (magazine)
            "s", # Step 6 Select existing
            "1 2", # categories 1 and 2
            "Y", "Y", "Y", "Y",
            "",
            ""
        ]
        proc = self.run_1sh(inputs)
        self.assertEqual(proc.returncode, 0, f"STDOUT: {proc.stdout}\nSTDERR: {proc.stderr}")
        self.assertIn("SUCCESS!", proc.stdout)

        output_dir = os.path.join(SCRIPT_DIR, 'select-cat-store-site')
        self.assertTrue(os.path.exists(output_dir))

        # Cleanup
        if os.path.exists(output_dir):
            shutil.rmtree(output_dir)

if __name__ == '__main__':
    unittest.main()
