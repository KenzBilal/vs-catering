import re

with open("src/pages/auth/Signup.jsx", "r") as f:
    text = f.read()

# Replace the outer div wrapper
text = text.replace('className="min-h-screen bg-stone-50 flex items-center justify-center p-4"', 'className="min-h-screen bg-[#f4ece4] flex flex-col justify-center sm:px-6 lg:px-8 py-12"')

# Replace inner form container box
text = text.replace('className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100"', 'className="sm:mx-auto sm:w-full sm:max-w-md bg-[#fcf8f4] py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-[#e8dccb]"')

# Top logo container
text = text.replace('className="h-16 w-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"', 'className="hidden"')

# Top Header text
text = text.replace('className="text-3xl font-bold text-stone-800"', 'className="text-center text-3xl font-extrabold text-[#2c2420]"')
text = text.replace('className="text-stone-500 mt-2"', 'className="hidden"')

# Text inputs labels
text = text.replace('text-stone-700', 'text-[#4a3f35]')

# Text inputs wrapper 
text = text.replace('bg-stone-50 border ${errors.email ? \'border-red-300 focus:ring-red-200\' : \'border-stone-200 focus:border-orange-500 focus:ring-orange-200\'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4', 'bg-white border text-[#2c2420] focus:ring-[#1c1917] focus:border-[#1c1917] sm:text-sm rounded-xl placeholder-[#8a7f75] ${errors.email ? \'border-red-300\' : \'border-[#e8dccb]\'}')

text = text.replace('bg-stone-50 border ${errors.password ? \'border-red-300 focus:ring-red-200\' : \'border-stone-200 focus:border-orange-500 focus:ring-orange-200\'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4', 'bg-white border text-[#2c2420] focus:ring-[#1c1917] focus:border-[#1c1917] sm:text-sm rounded-xl placeholder-[#8a7f75] ${errors.password ? \'border-red-300\' : \'border-[#e8dccb]\'}')

# Links color
text = text.replace('text-orange-600', 'text-[#1c1917]')
text = text.replace('hover:text-orange-700', 'hover:text-black')
text = text.replace('focus:ring-orange-200', 'focus:ring-[#1c1917]')

# Button color
text = text.replace('bg-orange-600', 'bg-[#1c1917]')
text = text.replace('hover:bg-orange-700', 'hover:bg-black')

with open("src/pages/auth/Signup.jsx", "w") as f:
    f.write(text)
