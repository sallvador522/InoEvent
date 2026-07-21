import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i in range(len(lines)):
    line = lines[i]
    if 'src=' in line:
        stripped = line.lstrip()
        indent = len(line) - len(stripped)
        
        # If it's just `src=...` and we are missing `<img`
        if stripped.startswith('src=') and i > 0 and '<EditableImageWrapper' not in lines[i-1]:
            # Add <img in front
            line = (' ' * indent) + '<img\n' + line
    
    new_lines.append(line)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(new_lines)
