with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # if line is exactly `<img` or `<img ` and next line contains `key={i}`
    if stripped == '<img' and i + 1 < len(lines) and 'key={i}' in lines[i+1]:
        # skip this line
        i += 1
        continue
    
    # if line contains `<img` and `key={i}` inline e.g. `<div <img`
    if '<img' in line and 'key={i}' in line:
        line = line.replace('<img', '')
    
    new_lines.append(line)
    i += 1

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(new_lines)
