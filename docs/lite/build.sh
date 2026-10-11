#!/usr/bin/env bash
# Rebuilds the lite PDFs and DOCXs from their *.src.html sources.
# Needs: graphviz (dot), libreoffice (soffice), python3.
set -euo pipefail
cd "$(dirname "$0")"

dot -Kneato -Tpng -Gdpi=150 er-lite.dot -o er-lite.png
dot -Kneato -Tsvg er-lite.dot -o er-lite.svg

for doc in DB-Design-Lite Explanation-Guide; do
  # 1. Inline the ER image and the SQL files
  DOC=$doc python3 - <<'PY'
import base64, html, os
doc = os.environ['DOC']
src = open(f'{doc}.src.html', encoding='utf8').read()
rd = lambda f: html.escape(open(f, encoding='utf8').read())
out = (src.replace('{{ER_B64}}', base64.b64encode(open('er-lite.png', 'rb').read()).decode())
          .replace('{{SCHEMA_SQL}}', rd('schema-lite.sql'))
          .replace('{{QUERIES_SQL}}', rd('queries-lite.sql')))
open(f'{doc}.html', 'w', encoding='utf8').write(out)
PY

  # 2. HTML -> ODT, force A4 with 2 cm margins (Writer ignores @page in CSS)
  rm -f "$doc.odt" "$doc.pdf" "$doc.docx"
  soffice --headless --infilter="HTML (StarWriter)" --convert-to odt --outdir . "$doc.html" >/dev/null
  DOC=$doc python3 - <<'PY'
import zipfile, re, shutil, os
src = os.environ['DOC'] + '.odt'; tmp = src + '.tmp'
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

  # 3. ODT -> PDF and DOCX
  soffice --headless --convert-to pdf:writer_pdf_Export --outdir . "$doc.odt" >/dev/null
  soffice --headless --convert-to docx:"MS Word 2007 XML" --outdir . "$doc.odt" >/dev/null
  rm -f "$doc.html" "$doc.odt"
  echo "built: $doc.pdf $doc.docx"
done
