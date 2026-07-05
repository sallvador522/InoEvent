import re

with open('server.ts', 'r') as f:
    content = f.read()

# Replace the block
content = re.sub(
    r'const possiblePaths = \[\s*path\.join\(process\.cwd\(\),\s*\'dist/index\.html\'\),\s*path\.join\(process\.cwd\(\),\s*\'index\.html\'\),\s*\];',
    r'const possiblePaths = [\n      path.join(process.cwd(), \'dist/index.html\'),\n      path.join(process.cwd(), \'index.html\')\n    ];',
    content
)

with open('server.ts', 'w') as f:
    f.write(content)
