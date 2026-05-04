import re

def update_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Replace colors
    # Orange replacements
    content = content.replace('bg-orange-50', 'bg-stone-50')
    content = content.replace('bg-orange-100', 'bg-stone-100')
    content = content.replace('bg-orange-500', 'bg-stone-800')
    content = content.replace('bg-orange-600', 'bg-stone-900')
    content = content.replace('hover:bg-orange-700', 'hover:bg-stone-800')
    
    content = content.replace('text-orange-500', 'text-stone-800')
    content = content.replace('text-orange-600', 'text-stone-900')
    content = content.replace('hover:text-orange-700', 'hover:text-stone-700')
    content = content.replace('text-orange-700', 'text-stone-800')

    content = content.replace('border-orange-500', 'border-stone-800')
    content = content.replace('focus:border-orange-500', 'focus:border-stone-800')
    content = content.replace('focus:ring-orange-200', 'focus:ring-stone-200')
    content = content.replace('focus:ring-orange-500', 'focus:ring-stone-800')
    content = content.replace('focus:ring-orange-400', 'focus:ring-stone-400')
    
    # White background for inputs inside cream wrapper
    content = content.replace('bg-gray-50', 'bg-white')
    content = content.replace('bg-stone-50 border', 'bg-white border')

    with open(filename, 'w') as f:
        f.write(content)

update_file('src/pages/auth/Login.jsx')
update_file('src/pages/auth/Signup.jsx')
