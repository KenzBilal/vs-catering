import re

# LOGIN
with open("old_login.jsx", "r") as f:
    text = f.read()

text = re.sub(r'import \{ auth \} from "../../lib/firebase";\n', '', text)
text = re.sub(r'import \{ GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup \} from "firebase/auth";\n', 'import { useAuthActions } from "@convex-dev/auth/react";\n', text)
text = text.replace('import { useAuth } from "../../lib/AuthContext";\n', '')
text = re.sub(r'\n\s*const \{ login \} = useAuth\(\);', '', text)
text = re.sub(r'const loginUserAction = useAction\(api.auth_actions.verifyAndLogin\);', 'const { signIn } = useAuthActions();', text)

logic_to_replace = r"""    setLoading\(true\);\n    try \{.*?} catch \(e\) \{"""
new_logic = """    setLoading(true);
    try {
      await signIn("password", { email: firebaseEmail, password, flow: "signIn" });
      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch (e) {"""

text = re.sub(logic_to_replace, new_logic, text, flags=re.DOTALL)

with open("src/pages/auth/Login.jsx", "w") as f:
    f.write(text)


# SIGNUP
with open("old_signup.jsx", "r") as f:
    stext = f.read()

stext = re.sub(r'import \{ auth \} from "../../lib/firebase";\n', '', stext)
stext = re.sub(r'import \{ GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup \} from "firebase/auth";\n', 'import { useAuthActions } from "@convex-dev/auth/react";\n', stext)
stext = stext.replace('import { useAuth } from "../../lib/AuthContext";\n', '')
stext = re.sub(r'\n\s*const \{ login \} = useAuth\(\);', '', stext)
stext = re.sub(r'const signupUserAction = useAction\(api.auth_actions.signup\);', 'const { signIn } = useAuthActions();', stext)


s_logic_to_replace = r"""    setLoading\(true\);\n    try \{.*?} catch \(error\) \{"""
s_new_logic = """    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signUp", phone, name: `${firstName} ${lastName}` });
      toast.success("Account created successfully!");
      navigate("/", { replace: true });
    } catch (error) {"""

stext = re.sub(s_logic_to_replace, s_new_logic, stext, flags=re.DOTALL)

with open("src/pages/auth/Signup.jsx", "w") as f:
    f.write(stext)

