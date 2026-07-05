import re

with open('server.ts', 'r') as f:
    content = f.read()

replacement = r"""
app.get('/invite/:id', async (req, res, next) => {
  // In development, skip SEO injection and let Vite handle the HTML to prevent white screens
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const { id } = req.params;
"""

content = re.sub(r"app\.get\('/invite/:id', async \(req, res, next\) => \{\n  const \{ id \} = req\.params;", replacement.strip(), content)

with open('server.ts', 'w') as f:
    f.write(content)
