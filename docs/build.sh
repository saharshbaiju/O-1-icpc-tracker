#!/usr/bin/env bash
# Rebuilds DB-Design.pdf and DB-Design.docx from DB-Design.src.html.
# Needs: graphviz (dot), libreoffice (soffice), python3 with Pillow.
set -euo pipefail
cd "$(dirname "$0")"

# 1. Diagrams
dot -Tpng -Gdpi=150 -Gratio=0.75 er-diagram.dot -o er-diagram.png
dot -Tsvg -Gratio=0.75 er-diagram.dot -o er-diagram.svg
dot -Tpng -Gdpi=150 er-overview.dot -o er-overview.png

# 2. Inline the images and the DDL into a single HTML file
python3 - <<'PY'
import base64, html
from PIL import Image
Image.open('er-diagram.png').rotate(90, expand=True).save('/tmp/er-rot.png')
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()
src = open('DB-Design.src.html', encoding='utf8').read()
out = (src.replace('{{ER_OVERVIEW_B64}}', b64('er-overview.png'))
          .replace('{{ER_PNG_B64}}', b64('/tmp/er-rot.png'))
          .replace('{{SCHEMA_SQL}}', html.escape(open('schema.sql', encoding='utf8').read())))
open('DB-Design.html', 'w', encoding='utf8').write(out)
PY

# 3. HTML -> ODT, force A4 with 2 cm margins (Writer ignores @page in CSS)
rm -f DB-Design.odt DB-Design.pdf DB-Design.docx
soffice --headless --infilter="HTML (StarWriter)" --convert-to odt --outdir . DB-Design.html >/dev/null
python3 - <<'PY'
import zipfile, re, shutil
src, tmp = 'DB-Design.odt', 'DB-Design.a4.odt'
zin, zout = zipfile.ZipFile(src), zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
def fix(m):
    t = m.group(0)
    t = re.sub(r'fo:page-width="[^"]*"', 'fo:page-width="21cm"', t)
    t = re.sub(r'fo:page-height="[^"]*"', 'fo:page-height="29.7cm"', t)
    for k in ('top', 'bottom', 'left', 'right'):
        t = re.sub(r'fo:margin-%s="[^"]*"' % k, 'fo:margin-%s="2cm"' % k, t)
    return t
for it in zin.infolist():
    d = zin.read(it.filename)
    if it.filename == 'styles.xml':
        d = re.sub(r'<style:page-layout-properties[^>]*>', fix, d.decode('utf8')).encode('utf8')
    zout.writestr(it, d)
zout.close(); zin.close(); shutil.move(tmp, src)
PY

# 4. ODT -> PDF and DOCX
soffice --headless --convert-to pdf:writer_pdf_Export --outdir . DB-Design.odt >/dev/null
soffice --headless --convert-to docx:"MS Word 2007 XML" --outdir . DB-Design.odt >/dev/null
rm -f DB-Design.html DB-Design.odt /tmp/er-rot.png
echo "built: DB-Design.pdf DB-Design.docx"
