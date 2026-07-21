import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    lines = f.readlines()

for i in range(len(lines)):
    # If the line contains src= but the previous line doesn't end with a tag and doesn't contain <EditableImageWrapper and it's not a script/style tag and the current line doesn't start with <img
    if 'src=' in lines[i] and not '<img' in lines[i] and not '<EditableImageWrapper' in lines[i-1] and not '<iframe' in lines[i-1]:
        # Let's verify by checking some specific indentation and the previous line
        prev_line = lines[i-1].strip()
        if prev_line == '{value ? (' or prev_line == '>' or prev_line == 'className="w-24 h-24 rounded-full overflow-hidden mb-4 grayscale opacity-80">' or prev_line == 'className="aspect-[3/4] rounded-t-[100px] overflow-hidden shadow-lg">' or prev_line == 'className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">':
            # This is definitely missing an <img
            pass
            
# Let's use a simpler approach. I know the exact lines that were broken because they were the ones with loading="lazy".
# We can just look at the git diff... oh wait there is no git.
