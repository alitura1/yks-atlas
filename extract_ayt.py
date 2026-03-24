import fitz
import base64
import re
import json

doc = fitz.open('aytmat.pdf')

imgs = {}
questions = []

current_year = 2020
q_num = 1

for i in range(len(doc)):
    page = doc[i]
    text = page.get_text()
    
    # Try to find year
    yr_match = re.search(r'(20\d\d)-AYT', text)
    if yr_match:
        current_year = int(yr_match.group(1))
        q_num = 1
        
    # Render page to image
    pix = page.get_pixmap(dpi=150)
    img_data = pix.tobytes("jpeg")
    b64 = base64.b64encode(img_data).decode('utf-8')
    pg_id = f"ayt_p{i:03d}"
    
    imgs[pg_id] = f"data:image/jpeg;base64,{b64}"
    
    questions.append({
        "yr": current_year,
        "num": q_num,
        "topic": "all",
        "title": f"AYT Mat Soru {q_num}",
        "desc": f"{current_year} AYT Matematik",
        "pg": pg_id,
        "ans": "A", # default mock answer
        "tags": ["AYT", "Matematik"]
    })
    q_num += 1

with open('src/data/ayt_mat.js', 'w', encoding='utf-8') as f:
    f.write("export const IMGS = {\n")
    for k, v in imgs.items():
        f.write(f'  "{k}": "{v}",\n')
    f.write("};\n\n")
    
    f.write("export const QUESTIONS = [\n")
    for q in questions:
        f.write(f"  {json.dumps(q)},\n")
    f.write("];\n")

print("Generated src/data/ayt_mat.js successfully.")
