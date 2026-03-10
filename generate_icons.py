import os
from PIL import Image

def process_app_icon(src_path, dest_dir):
    try:
        img = Image.open(src_path).convert("RGB")
        width, height = img.size
        
        # We want a square crop
        size = min(width, height)
        left = (width - size) / 2
        top = (height - size) / 2
        right = (width + size) / 2
        bottom = (height + size) / 2
        img = img.crop((left, top, right, bottom))
        
        # Crop 12% off each side to remove the outer circular border
        # This keeps the central blob and the "Echo Mind" text in frame
        crop_margin = int(size * 0.12)
        inner_box = (crop_margin, crop_margin, size - crop_margin, size - crop_margin)
        img = img.crop(inner_box)
        
        sizes = [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024]
        
        for s in sizes:
            resized = img.resize((s, s), Image.Resampling.LANCZOS)
            out_path = os.path.join(dest_dir, f"icon-{s}.png")
            resized.save(out_path)
            
        print("Success: App icons generated.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    src = "app_icon_source.jpg"
    dest = "ios/EchoMind/Images.xcassets/AppIcon.appiconset"
    process_app_icon(src, dest)
