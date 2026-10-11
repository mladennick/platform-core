import sys

text = sys.stdin.read()
lines = text.splitlines(True)
cleaned = []
for line in lines:
    lower = line.lower()
    if "cursoragent@cursor.com" in lower:
        continue
    if lower.startswith("made-with: cursor"):
        continue
    if lower.startswith("co-authored-by: cursor"):
        continue
    cleaned.append(line)
sys.stdout.write("".join(cleaned))
