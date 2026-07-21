with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i in range(len(lines)):
    line = lines[i]
    stripped = line.strip()
    
    if stripped.startswith('src='):
        # check if previous line ends with > or ( or { or if it's an EditableImageWrapper
        prev_line = lines[i-1].strip() if i > 0 else ''
        
        # If it's EditableImageWrapper or iframe, do not add <img
        if '<EditableImageWrapper' in prev_line or '<iframe' in prev_line:
            new_lines.append(line)
            continue
            
        # It's an image that lost its <img prefix!
        indent = len(line) - len(line.lstrip())
        new_lines.append((' ' * indent) + '<img\n')
        new_lines.append(line)
    else:
        new_lines.append(line)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(new_lines)
