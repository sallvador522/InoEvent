with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i in range(len(lines)):
    line = lines[i]
    if line.endswith('<img\n'):
        # Just remove the <img from the end of the line
        line = line[:-5] + '\n'
    new_lines.append(line)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(new_lines)
