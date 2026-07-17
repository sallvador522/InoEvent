import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Add isPremium checking
old_isTemporarilyBlocked = """
  // Check if event is blocked
  const isPast30Days = activeEvent?.isoDate ? (new Date().getTime() - new Date(activeEvent.isoDate).getTime()) > 30 * 24 * 60 * 60 * 1000 : false;
  const isTemporarilyBlocked = !isEditing && activeEvent && (
"""

new_isTemporarilyBlocked = """
  // Premium Checks
  const isPremium = activeEvent && (activeEvent as any).plan && ((activeEvent as any).plan === 'Premium' || (activeEvent as any).plan === 'Business' || (activeEvent as any).plan === 'Corporate');

  // Check if event is blocked
  const isPast30Days = activeEvent?.isoDate ? (new Date().getTime() - new Date(activeEvent.isoDate).getTime()) > 30 * 24 * 60 * 60 * 1000 : false;
  const isTemporarilyBlocked = !isEditing && activeEvent && (
"""
content = content.replace(old_isTemporarilyBlocked, new_isTemporarilyBlocked)

# Now hide TocaPlayer
content = content.replace("<TocaPlayer", "{isPremium && <TocaPlayer")
content = content.replace('          localEvent?.layoutMode === "INDUSTRIAL"\n            }\n          />', '          localEvent?.layoutMode === "INDUSTRIAL"\n            }\n          />}')

content = content.replace('          activeEvent.layoutMode === "INDUSTRIAL"\n        }\n      />', '          activeEvent.layoutMode === "INDUSTRIAL"\n        }\n      />}')

# Now hide Guestbook
content = content.replace('<Guestbook eventId={event.id} layoutMode={event.layoutMode} />', '{isPremium && <Guestbook eventId={event.id} layoutMode={event.layoutMode} />}')


with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)

