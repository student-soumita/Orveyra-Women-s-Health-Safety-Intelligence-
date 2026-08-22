import re

with open('app/services/ai_engine.py', 'rb') as f:
    content = f.read()

for m in re.finditer(b'"""', content):
    start = m.start()
    line_num = content[:start].count(b'\n') + 1
    surrounding = content[max(0,start-20):start+23]
    print(f'Line {line_num}: {repr(surrounding)}')
