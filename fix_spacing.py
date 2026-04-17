from PIL import Image

# Load the image
img = Image.open("/home/kenz/.gemini/antigravity/brain/0b7e9649-20d5-43dc-bba7-d0d790cab50d/catering_only_icon_1776467434046.png")
width, height = img.size

# We know the logo is in the top half, and text is in the lower half.
# Let's crop the top part (logo)
top_part = img.crop((0, 0, width, 550))

# Let's crop the bottom part (text)
# We will guess the text is around Y=720 to 850
bottom_part = img.crop((0, 700, width, height))

# Create a new image to paste them together, removing 150px of empty space
new_height = top_part.height + bottom_part.height
new_img = Image.new('RGB', (width, new_height), (0, 0, 0))
new_img.paste(top_part, (0, 0))
new_img.paste(bottom_part, (0, top_part.height))

# Now to make it square again (optional, but good for icons)
# We pad it with black
final_size = max(width, new_height)
final_img = Image.new('RGB', (final_size, final_size), (24, 25, 26)) # #18191a or similar almost black
# Wait, let's just use exact black (0,0,0) or check the top left pixel color
bg_color = img.getpixel((0,0))
final_img = Image.new('RGB', (final_size, final_size), bg_color)
y_offset = (final_size - new_height) // 2
final_img.paste(new_img, (0, y_offset))

final_img.save("public/icon.webp", "WEBP")
print("Done")
