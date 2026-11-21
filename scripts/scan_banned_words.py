"""Scan frontend files for banned academic/developer/college demo words."""

import os
import re
from pathlib import Path

banned = [
    (r"\bcapstone\b", "capstone"),
    (r"\bfinal[- ]year\b", "final-year"),
    (r"\bB\.?Tech\b", "B.Tech"),
    (r"\bproject\b", "project"),
    (r"\buniversity\b", "university"),
    (r"\bdemo\b", "demo"),
    (r"test preset", "test preset"),
    (r"\bextrapolation\b", "extrapolation"),
    (r"training region", "training region"),
    (r"V1\.0", "V1.0"),
    (r"\bbeta\b", "beta"),
    (r"\blorem\b", "lorem"),
    (r"\bTODO\b", "TODO"),
    (r"\bplaceholder\b", "placeholder (text)"),
    (r"\bsample\b", "sample"),
    (r"\bmock\b", "mock"),
    (r"\bdebug\b", "debug"),
    (r"\bXGBoost\b", "XGBoost"),
    (r"Random Forest", "Random Forest"),
    (r"\bMLP\b", "MLP"),
    (r"\bSHAP\b", "SHAP"),
    (r"\bLIME\b", "LIME"),
    (r"\bCAMS\b", "CAMS"),
]

files_to_check = []
for root, dirs, files in os.walk("frontend/src"):
    for f in files:
        if f.endswith((".jsx", ".js", ".html", ".json", ".css")):
            files_to_check.append(Path(root) / f)

for extra in ["frontend/index.html", "frontend/public/manifest.json", "frontend/manifest.json"]:
    p = Path(extra)
    if p.exists():
        files_to_check.append(p)

all_hits = []
for p in files_to_check:
    lines = p.read_text(encoding="utf-8", errors="ignore").splitlines()
    for idx, line in enumerate(lines, 1):
        for pat, name in banned:
            if name == "LIME":
                m = re.search(r"\bLIME\b", line)
                if not m:
                    continue
            elif name == "placeholder (text)":
                if "placeholder=" in line and not re.search(r'placeholder=["\'][^"\']*placeholder', line, re.I):
                    continue
                m = re.search(r"\bplaceholder\b", line, re.I)
                if not m:
                    continue
            elif name == "demo":
                # Check if it's code/variable or user facing
                m = re.search(pat, line, re.I)
                if not m:
                    continue
            else:
                m = re.search(pat, line, re.I)
                if not m:
                    continue

            # Strip leading/trailing
            all_hits.append((str(p).replace("\\", "/"), idx, name, line.strip()))

output_file = Path("banned_hits_audit.txt")
with open(output_file, "w", encoding="utf-8") as f:
    for h in all_hits:
        f.write(f"{h[0]}:{h[1]} [{h[2]}] -> {h[3]}\n")

by_file = {}
for h in all_hits:
    by_file.setdefault(h[0], []).append(h)

print(f"Total user-facing hits found: {len(all_hits)} across {len(by_file)} files.")
for fpath, items in sorted(by_file.items(), key=lambda x: -len(x[1])):
    print(f"  {fpath}: {len(items)} hits")
