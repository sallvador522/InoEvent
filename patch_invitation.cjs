const fs = require('fs');
let content = fs.readFileSync('features/invitation/InvitationView.tsx', 'utf8');

const regex = /const guestsCollection = collection\(db, "events", event\.id, "guests"\);[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\),\s*\};?\)?;\s*/;

const newCode = `      const normalizedPhone = phone.trim().replace(/[\\s\\-()]/g, "");
      const guestData = {
        name: name.trim(),
        phone: normalizedPhone,
        status: status === "yes" ? "CONFIRMED" : "DECLINED",
        adults: status === "yes" ? companions + 1 : 0,
        children: 0,
        message: message.trim(),
        dietaryRestrictions: dietaryRestrictions.trim(),
        checkedIn: false,
      };

      const res = await fetch(\`/api/events/\${event.id}/rsvp\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, guestData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Erro ao confirmar presença.", { id: toastId });
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      const guestId = data.guestId;
      `;

content = content.replace(regex, newCode);
// Need to handle the `guestRef.id` reference in successData
content = content.replace(/setSuccessData\(\{ id: guestRef\.id, name: name\.trim\(\) \}\);/g, 'setSuccessData({ id: guestId, name: name.trim() });');
fs.writeFileSync('features/invitation/InvitationView.tsx', content);
