"""Small, transparent tracked-file credential scan; never prints matched values."""
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
paths = subprocess.check_output(
    ['git', '-c', f'safe.directory={root.as_posix()}', 'ls-files', '-z'],
    cwd=root,
).decode().split('\0')
patterns = [
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'AKIA[0-9A-Z]{16}'),
    re.compile(r'gh[pousr]_[A-Za-z0-9]{30,}'),
    re.compile(r'(?m)^ORS_API_KEY[ \t]*=[ \t]*[^\s\n]+'),
]
findings = []
checked = 0
for relative in filter(None, paths):
    path = root / relative
    if path.suffix in {'.png', '.jpg'}:
        continue
    checked += 1
    content = path.read_text(encoding='utf-8-sig', errors='replace')
    for pattern in patterns:
        for match in pattern.finditer(content):
            findings.append(f'{relative}:{content[:match.start()].count(chr(10)) + 1}')
print(f'Checked {checked} tracked text files; {len(findings)} potential credential findings.')
for finding in findings:
    print(finding)
raise SystemExit(bool(findings))
