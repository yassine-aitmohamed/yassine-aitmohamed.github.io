import hashlib, html, json, pathlib, re, shutil, sys

root = pathlib.Path(sys.argv[1]).resolve()
src = pathlib.Path(sys.argv[2]).resolve()
page = root / "research.html"
docs = root / "Documents research"
data = json.loads((src / "payload.json").read_text(encoding="utf-8"))
text = page.read_text(encoding="utf-8")

def entry(p):
    link = ""
    pdf = src / p.get("pdf", "")
    if p.get("pdf") and pdf.is_file():
        shutil.copyfile(pdf, docs / p["pdf"])
        v = hashlib.sha256(pdf.read_bytes()).hexdigest()[:8]
        href = "Documents%20research/" + p["pdf"].replace(" ", "%20") + "?v=" + v
        link = f' · <a href="{href}" target="_blank" rel="noopener">pdf</a>'
    who = f' ({p["with"]})' if p.get("with") else ""
    return (
        f'      <li data-n="{p["n"]}" data-schema="{p["schema"]}">\n'
        f'        <div><b>{html.escape(p["title"])}</b>{who}</div>\n'
        f'        <div class="paper-meta">\n'
        f'          <span class="status">{html.escape(p["status"])}</span>{link}<br>\n'
        f'          <button class="toggle" type="button" aria-expanded="false">'
        f'<span class="ic" aria-hidden="true"></span>Abstract</button>\n'
        f'          <div class="abs-wrap"><div class="abstract"><div class="in">{p["abstract"]}</div></div></div>\n'
        f'        </div>\n'
        f'      </li>\n'
    )

for p in data["papers"]:
    block = re.compile(rf'      <!-- release:{p["slot"]} -->\n.*?<!-- /release:{p["slot"]} -->\n', re.S)
    text, k = block.subn(lambda _m: entry(p), text, count=1)
    if k != 1:
        sys.exit(f'slot {p["slot"]} not found')
    for kw in p.get("keywords", []):
        pat = re.compile(r'(data-papers=")([\d ]*)(">' + re.escape(kw) + r'</span>)')
        def add(m):
            nums = sorted({*m.group(2).split(), str(p["n"])}, key=int)
            return m.group(1) + " ".join(nums) + m.group(3)
        text = pat.sub(add, text)

text = re.sub(r'\n<script src="release\.js[^"]*"></script>', "", text)
page.write_text(text, encoding="utf-8")
