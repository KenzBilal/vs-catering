import re

with open("convex/users.js", "r") as f:
    text = f.read()

new_func = """
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await getAuthUser(ctx);
    } catch (e) {
      console.error(e);
      return { error_debug: e.message, stack: e.stack };
    }
  },
});
"""

text = re.sub(r'export const getCurrentUser = query\(\{.*?\}\);', new_func, text, flags=re.DOTALL)

with open("convex/users.js", "w") as f:
    f.write(text)
