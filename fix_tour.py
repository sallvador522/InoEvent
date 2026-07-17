import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix Joyride import
content = content.replace("import Joyride, { CallBackProps, STATUS } from \"react-joyride\";", "import { Joyride, STATUS } from \"react-joyride\";")

# Fix CallBackProps type
content = content.replace("const handleJoyrideCallback = (data: CallBackProps) => {", "const handleJoyrideCallback = (data: any) => {")

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
