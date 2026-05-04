import re

def update_file(filename, is_login):
    with open(filename, 'r') as f:
        content = f.read()

    # Imports
    content = re.sub(
        r"import \{.*?\} from 'firebase/auth';\s*import \{ auth \} from '../../lib/firebase';\s*import \{.*?\} from '../../lib/firebase';",
        "import { useAuthActions } from '@convex-dev/auth/react';",
        content,
        flags=re.DOTALL
    )

    # Use actions
    content = re.sub(
        r"const \[error, setError\] = useState\(''\);",
        "const [error, setError] = useState('');\n  const { signIn } = useAuthActions();",
        content
    )

    # Handle submit
    if is_login:
        submit_logic = """    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }"""
    else:
        submit_logic = """    try {
      await signIn("password", { email, password, flow: "signUp" });
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError('Failed to create an account');
    } finally {
      setIsLoading(false);
    }"""

    content = re.sub(
        r"try \{.*?finally \{\s*setIsLoading\(false\);\s*\}",
        submit_logic,
        content,
        flags=re.DOTALL
    )

    with open(filename, 'w') as f:
        f.write(content)

update_file('src/pages/auth/Login.jsx', True)
update_file('src/pages/auth/Signup.jsx', False)
