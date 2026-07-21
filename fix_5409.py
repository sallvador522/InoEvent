with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'key={i}' in lines[i] and '<img' in lines[i+1]:
        # we swap them or we wrap them correctly.
        lines[i] = lines[i].replace('key={i}', '<img\n                    key={i}')
        lines[i+1] = lines[i+1].replace('<img\n', '')

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(lines)
