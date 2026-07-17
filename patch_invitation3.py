import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

# Fix draftData cast
content = content.replace('(staticEvent.draftData || staticEvent)', '((staticEvent as any).draftData || staticEvent)')
content = content.replace('customEvt.draftData', '(customEvt as any).draftData')

# Fix setDoc to updateDoc where appropriate
old_publish = """
      // Save document values
      const savedPayload = {
        ...localEvent,
        ownerId: user.uid,
        updatedAt: new Date().toISOString(),
        isPublished: true,
      };
      // Important: Since we're publishing, we clear draftData by overwriting it using setDoc without draftData.
      // But wait, setDoc overwrites the entire document, so draftData is implicitly removed because it's not in savedPayload.
      await setDoc(eventRef, savedPayload);
"""
new_publish = """
      if (isNewSave) {
        const savedPayload = {
          ...localEvent,
          ownerId: user.uid,
          updatedAt: new Date().toISOString(),
          isPublished: true,
        };
        await setDoc(eventRef, savedPayload);
      } else {
        const { draftData, ...restEvent } = localEvent as any;
        await updateDoc(eventRef, {
          ...restEvent,
          ownerId: user.uid,
          updatedAt: new Date().toISOString(),
          isPublished: true,
          draftData: null,
        });
      }
"""
content = content.replace(old_publish, new_publish)

with open('features/invitation/InvitationView.tsx', 'w') as f:
    f.write(content)
print("Applied Python patches")
