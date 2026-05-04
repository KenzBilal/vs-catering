import os
import glob
import re

for filepath in glob.glob('convex/**/*.js', recursive=True):
    if 'node_modules' in filepath or '_generated' in filepath:
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace token: v.string() -> token: v.optional(v.string())
    content = re.sub(r'token:\s*v\.string\(\)', 'token: v.optional(v.string())', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

