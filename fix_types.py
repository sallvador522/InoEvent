import re

with open('types.ts', 'r') as f:
    content = f.read()

# remove the first occurrences of ownerId and createdAt added recently
content = content.replace("ownerId?: string;\n  createdAt?: string;\n", "", 1)

with open('types.ts', 'w') as f:
    f.write(content)
print("Types fixed")
