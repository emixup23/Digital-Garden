import struct
import zlib
import math
import os

def make_png(width, height, draw_pixel):
    raw = bytearray()
    for y in range(height):
        raw.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = draw_pixel(x, y, width, height)
            raw.extend((r, g, b, a))
    
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    compressed = zlib.compress(bytes(raw), 9)
    
    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        crc = struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c + crc
    
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

def render_icon(x, y, w, h, is_maskable=False):
    # Normalize coordinates to 0..1
    nx = x / (w - 1)
    ny = y / (h - 1)
    
    # Scale coordinates if maskable (safe area is central 80%)
    if is_maskable:
        # Scale to 0.75 and center
        cx = (nx - 0.5) / 0.75 + 0.5
        cy = (ny - 0.5) / 0.75 + 0.5
    else:
        cx = nx
        cy = ny

    # Base background: deep twilight dark (#0c0714 to #150d24)
    grad = (nx + ny) * 0.5
    bg_r = int(12 + (21 - 12) * grad)
    bg_g = int(7 + (13 - 7) * grad)
    bg_b = int(20 + (36 - 20) * grad)

    # Check if inside icon area
    if cx < 0 or cx > 1 or cy < 0 or cy > 1:
        return (bg_r, bg_g, bg_b, 255)

    # Graph node centers (relative 0..1 in icon space)
    nodes = [
        (0.5, 0.5, 0.12, (236, 72, 153), (250, 245, 255)),   # Center hub (pink / white)
        (0.28, 0.32, 0.055, (192, 132, 252), (30, 17, 54)),  # Top Left
        (0.72, 0.32, 0.055, (192, 132, 252), (30, 17, 54)),  # Top Right
        (0.32, 0.70, 0.045, (129, 140, 248), (30, 17, 54)),  # Bottom Left
        (0.68, 0.70, 0.045, (129, 140, 248), (30, 17, 54)),  # Bottom Right
    ]

    # Lines between nodes
    links = [
        (0.5, 0.5, 0.28, 0.32),
        (0.5, 0.5, 0.72, 0.32),
        (0.5, 0.5, 0.32, 0.70),
        (0.5, 0.5, 0.68, 0.70),
        (0.28, 0.32, 0.72, 0.32),
        (0.28, 0.32, 0.32, 0.70),
        (0.72, 0.32, 0.68, 0.70),
    ]

    # Distance to line segment helper
    def dist_to_seg(px, py, x1, y1, x2, y2):
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return math.hypot(px - x1, py - y1)
        t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))

    # Check center brackets [[ ]]
    dx_c = cx - 0.5
    dy_c = cy - 0.5
    # Left bracket [
    in_bracket = False
    if (-0.05 <= dx_c <= -0.01) and (-0.04 <= dy_c <= 0.04):
        if dx_c <= -0.03 or dy_c <= -0.03 or dy_c >= 0.03:
            in_bracket = True
    # Right bracket ]
    if (0.01 <= dx_c <= 0.05) and (-0.04 <= dy_c <= 0.04):
        if dx_c >= 0.03 or dy_c <= -0.03 or dy_c >= 0.03:
            in_bracket = True

    if in_bracket and math.hypot(dx_c, dy_c) < 0.07:
        return (250, 245, 255, 255)

    # Check center node
    d_center = math.hypot(dx_c, dy_c)
    if d_center < 0.065:
        return (236, 72, 153, 255)
    elif d_center < 0.09:
        # Outer ring of hub
        return (219, 39, 119, 255) if d_center > 0.08 else (36, 19, 66, 255)

    # Check satellites
    for nx_n, ny_n, radius, border_col, fill_col in nodes[1:]:
        d = math.hypot(cx - nx_n, cy - ny_n)
        if d < radius * 0.45:
            return (*border_col, 255)
        elif d < radius:
            return (*fill_col, 255)
        elif d < radius + 0.012:
            return (*border_col, 255)

    # Check links
    for x1, y1, x2, y2 in links:
        d_line = dist_to_seg(cx, cy, x1, y1, x2, y2)
        if d_line < 0.008:
            return (59, 34, 102, 255)

    # Default background
    return (bg_r, bg_g, bg_b, 255)

os.makedirs('public', exist_ok=True)

# 1. 192x192
print("Generating pwa-192x192.png...")
with open('public/pwa-192x192.png', 'wb') as f:
    f.write(make_png(192, 192, lambda x, y, w, h: render_icon(x, y, w, h, False)))

# 2. 512x512
print("Generating pwa-512x512.png...")
with open('public/pwa-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, lambda x, y, w, h: render_icon(x, y, w, h, False)))

# 3. 512x512 Maskable
print("Generating pwa-maskable-512x512.png...")
with open('public/pwa-maskable-512x512.png', 'wb') as f:
    f.write(make_png(512, 512, lambda x, y, w, h: render_icon(x, y, w, h, True)))

# 4. 180x180 Apple Touch Icon
print("Generating apple-touch-icon.png...")
with open('public/apple-touch-icon.png', 'wb') as f:
    f.write(make_png(180, 180, lambda x, y, w, h: render_icon(x, y, w, h, False)))

# 5. Favicon 32x32 PNG copy
print("Generating favicon.ico...")
with open('public/favicon.ico', 'wb') as f:
    f.write(make_png(32, 32, lambda x, y, w, h: render_icon(x, y, w, h, False)))

print("Icon generation complete!")
