import re

with open("src/pages/auth/Login.jsx", "r") as f:
    text = f.read()

# Replace handleGoogleSignIn to just error gracefully instead of calling firebase
google_replace = r"  const handleGoogleSignIn = async \(\) => \{.+?  \};"
google_new = """  const handleGoogleSignIn = async () => {
    toast.error("Google sign-in is currently unavailable for this environment.");
  };"""

text = re.sub(google_replace, google_new, text, flags=re.DOTALL)
with open("src/pages/auth/Login.jsx", "w") as f:
    f.write(text)

with open("src/pages/auth/Signup.jsx", "r") as f:
    stext = f.read()

stext = re.sub(google_replace, google_new, stext, flags=re.DOTALL)
with open("src/pages/auth/Signup.jsx", "w") as f:
    f.write(stext)

