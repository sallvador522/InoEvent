import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# 1. Add import
if "import { CheckStatusModal } from './CheckStatusModal';" not in content:
    content = content.replace('import { RSVPForm } from "./RSVPForm";', 'import { RSVPForm } from "./RSVPForm";\nimport { CheckStatusModal } from "./CheckStatusModal";')
    # wait RSVPForm is not exported/imported, it is inline at the bottom of InvitationView.
    # Let's import it near the top
    content = content.replace('import { Guestbook } from "./Guestbook";', 'import { Guestbook } from "./Guestbook";\nimport { CheckStatusModal } from "./CheckStatusModal";')

# 2. Add state
if "const [isCheckStatusOpen, setCheckStatusOpen] = useState(false);" not in content:
    content = content.replace('const [isRSVPOpen, setRSVPOpen] = useState(false);', 'const [isRSVPOpen, setRSVPOpen] = useState(false);\n  const [isCheckStatusOpen, setCheckStatusOpen] = useState(false);')

# 3. Add Modal at the end of InvitationView before RSVPForm
modal_jsx = """
        {/* Check Status Modal */}
        <CheckStatusModal
          isOpen={isCheckStatusOpen}
          onClose={() => setCheckStatusOpen(false)}
          event={activeEvent}
        />
"""
if "Check Status Modal" not in content:
    content = content.replace('{/* Shared RSVP Modal */}', modal_jsx + '\n      {/* Shared RSVP Modal */}')


with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
