import fitz
import base64
import re
import json

doc = fitz.open('aytmat.pdf')

imgs = {}
questions = []

current_year = 2020
answers = {}

# Regex for parsing answers if found at the end
# Format usually: 1. A  2. B ...
def parse_answers(text, year):
    # This is a bit tricky, let's just use mock answers if not found
    pass

for i in range(len(doc)):
    page = doc[i]
    text = page.get_text()
    
    # Attempt to find the year on the page
    yr_match = re.search(r'(20\d\d)-AYT', text)
    if yr_match:
         current_year = int(yr_match.group(1))

    # Look for the answer key section later or within the text
    if "MATEMATİK TESTİ" in text and "1. " in text and "40. " in text and "10." in text:
        # It's likely an answer key page, let's try to extract answers
        lines = text.split('\n')
        q_ans_mode = False
        for line in lines:
            line = line.strip()
            # match "1. A", "2. B", etc. or "1.   A"
            m = re.match(r'^(\d+)\.\s*([A-E])$', line)
            if m:
                q_n = int(m.group(1))
                ans = m.group(2)
                answers[(current_year, q_n)] = ans
        continue

    # Get blocks
    blocks = page.get_text("dict")["blocks"]
    
    # Extract question numbers and their y-coordinates
    q_nums = []
    for b in blocks:
        if b['type'] == 0: # text block
            for l in b['lines']:
                for s in l['spans']:
                    txt = s['text'].strip()
                    if re.match(r'^\d+\.$', txt):
                        num = int(txt[:-1])
                        # If it's a question number (1 to 40)
                        if 1 <= num <= 40:
                            q_nums.append({
                                'num': num,
                                'bbox': s['bbox']
                            })
                            
    if not q_nums:
        continue
        
    # Sort q_nums by column (left < 300, right > 300), then by y0
    left_qs = sorted([q for q in q_nums if q['bbox'][0] < 300], key=lambda x: x['bbox'][1])
    right_qs = sorted([q for q in q_nums if q['bbox'][0] >= 300], key=lambda x: x['bbox'][1])
    
    page_width = page.rect.width
    page_height = page.rect.height
    
    for col_qs, is_left in [(left_qs, True), (right_qs, False)]:
        for idx, q in enumerate(col_qs):
            # Calculate crop rectangle
            x0 = 0 if is_left else page_width / 2
            x1 = page_width / 2 if is_left else page_width
            y0 = q['bbox'][1] - 5 # small padding above the number
            
            # Bottom is either the next question in the same column or page_height
            y1 = page_height - 30 # default bottom margin
            if idx + 1 < len(col_qs):
                y1 = col_qs[idx+1]['bbox'][1] - 5
                
            # If y1 - y0 is too small or negative, something went wrong, but usually OSYM format is strict
            if y1 > y0:
                rect = fitz.Rect(x0, y0, x1, y1)
                pix = page.get_pixmap(dpi=150, clip=rect)
                img_data = pix.tobytes("jpeg")
                b64 = base64.b64encode(img_data).decode('utf-8')
                
                pg_id = f"ayt_{current_year}_q{q['num']}"
                
                imgs[pg_id] = f"data:image/jpeg;base64,{b64}"
                
                # We fetch the answer if we have parsed it, otherwise default 'A'
                ans = answers.get((current_year, q['num']), "A")
                
                questions.append({
                    "yr": current_year,
                    "num": q['num'],
                    "topic": "all",
                    "title": f"AYT Mat Soru {q['num']}",
                    "desc": f"{current_year} AYT Matematik",
                    "pg": pg_id,
                    "ans": ans,
                    "tags": ["AYT", "Matematik"]
                })

print(f"Extracted {len(questions)} questions.")
print(f"Parsed {len(answers)} answers.")

# Now write to file
with open('src/data/ayt_mat.js', 'w', encoding='utf-8') as f:
    f.write("export const IMGS = {\n")
    for k, v in imgs.items():
        f.write(f'  "{k}": "{v}",\n')
    f.write("};\n\n")
    f.write("export const QUESTIONS = [\n")
    for q in questions:
        f.write(f"  {json.dumps(q)},\n")
    f.write("];\n")

print("Done writing src/data/ayt_mat.js")
