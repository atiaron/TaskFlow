import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, filename):
    # צור אייקון פשוט עם טקסט
    img = Image.new('RGB', (size, size), color='#1976d2')
    draw = ImageDraw.Draw(img)
    
    # הוסף טקסט
    try:
        font_size = size // 4
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "TF"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    draw.text((x, y), text, fill='white', font=font)
    
    # שמור
    img.save(filename, 'PNG')
    print(f"✅ Created {filename}")

# יצירת כל הגדלים
sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    create_icon(size, f"icon-{size}x{size}.png")

print("🎉 All icons created successfully!")
