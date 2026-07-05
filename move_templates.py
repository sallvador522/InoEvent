with open('mockData.ts', 'r') as f:
    lines = f.readlines()

# chany-pedro-wedding is at 363-426
# marnela-evandro-wedding is at 427-503

part1 = lines[:53] # up to "export const EVENTS: EventDetails[] = ["
part2 = lines[363:504] # chany-pedro-wedding and marnela-evandro-wedding
part3 = lines[53:363] # wedding-essential to wedding-industrial
part4 = lines[504:] # bridal-beauty onwards

new_lines = part1 + part2 + part3 + part4

with open('mockData.ts', 'w') as f:
    f.writelines(new_lines)
