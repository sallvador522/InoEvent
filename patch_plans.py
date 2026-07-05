import re

with open('server.ts', 'r') as f:
    content = f.read()

replacement = r"""
app.get('/plans', async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  try {
"""

content = re.sub(r"app\.get\('/plans', async \(req, res, next\) => \{\n  try \{", replacement.strip(), content)

with open('server.ts', 'w') as f:
    f.write(content)
