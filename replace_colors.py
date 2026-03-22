import os
import re

replacements = [
    # Hex
    (re.compile(r'#0B0C10', re.IGNORECASE), '#262B25'),
    (re.compile(r'#1F2833', re.IGNORECASE), '#000000'),
    (re.compile(r'#C5C6C7', re.IGNORECASE), '#FFFFFF'),
    (re.compile(r'#66FCF1', re.IGNORECASE), '#67F81D'),
    (re.compile(r'#45A29E', re.IGNORECASE), '#62CB2C'),
    
    # RGB with no spaces
    (re.compile(r'11,12,16'), '38, 43, 37'),
    (re.compile(r'31,40,51'), '0, 0, 0'),
    (re.compile(r'197,198,199'), '255, 255, 255'),
    (re.compile(r'102,252,241'), '103, 248, 29'),
    (re.compile(r'69,162,158'), '98, 203, 44'),
    
    # RGB with spaces
    (re.compile(r'11, 12, 16'), '38, 43, 37'),
    (re.compile(r'31, 40, 51'), '0, 0, 0'),
    (re.compile(r'197, 198, 199'), '255, 255, 255'),
    (re.compile(r'102, 252, 241'), '103, 248, 29'),
    (re.compile(r'69, 162, 158'), '98, 203, 44')
]

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Skipping {file_path}: {e}")
        return

    original_content = content
    for pattern, replacement in replacements:
        content = pattern.sub(replacement, content)
        
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {file_path}")

def main():
    target_dir = r"c:\Users\ABIJITH\OneDrive\Documents\web_rats\src"
    for root, dirs, files in os.walk(target_dir):
        for file in files:
            if file.endswith('.css') or file.endswith('.jsx') or file.endswith('.js') or file.endswith('.ts') or file.endswith('.tsx'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
