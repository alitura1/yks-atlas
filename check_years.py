import re
with open('src/data/ayt_mat.js', encoding='utf-8') as f:
    text = f.read()
years = set(re.findall(r'"yr":\s*(\d+)', text))
print(sorted(list(years)))
