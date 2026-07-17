import re

with open('features/invitation/InvitationView.tsx', 'r') as f:
    content = f.read()

tracking_effect = """
  // Track Page Views
  useEffect(() => {
    if (!isEditing && event && event.id && !event.isTemplate) {
      const viewedKey = `viewed_${event.id}`;
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, 'true');
        const today = new Date().toISOString().split('T')[0];
        const eventRef = doc(db, 'events', event.id);
        updateDoc(eventRef, {
          accessCount: increment(1),
          [`dailyAccesses.${today}`]: increment(1)
        }).catch(err => console.warn('Failed to track view:', err));
      }
    }
  }, [isEditing, event?.id, event?.isTemplate]);
"""

# Let's place it right before `if (firebaseLoading) {`
target = "if (firebaseLoading) {"

if target in content:
    content = content.replace(target, tracking_effect.strip() + "\n\n  " + target)
    with open('features/invitation/InvitationView.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
