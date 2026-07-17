import re

with open('types.ts', 'r') as f:
    types_content = f.read()

# Let's check LayoutMode
print("LayoutMode in types.ts:", re.search(r'type LayoutMode =[^;]+;', types_content).group(0))
