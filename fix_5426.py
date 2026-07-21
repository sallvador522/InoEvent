with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'key={i}' in lines[i] and '<img' in lines[i+1]:
        # we need to swap them
        tmp = lines[i]
        lines[i] = lines[i+1]
        lines[i+1] = tmp

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.writelines(lines)
