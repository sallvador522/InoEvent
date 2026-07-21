import json

with open("migrated_prompt_history/prompt_2026-01-14T19:17:39.871Z.json", "r") as f:
    data = json.load(f)

print(f"Total turns: {len(data)}")

# Let's print the text of the last 15 turns to see the conversation flow leading up to the end of the JSON.
for i in range(max(0, len(data)-15), len(data)):
    turn = data[i]
    print(f"Index: {i} - ID: {turn.get('id')} - AUTHOR: {turn.get('author')}")
    payload = turn.get('payload', {})
    if payload.get('type') == 'text':
        print(payload.get('text')[:400])
    elif payload.get('type') == 'thinking':
        print(payload.get('text')[:100] + "...")
    print("-" * 50)
