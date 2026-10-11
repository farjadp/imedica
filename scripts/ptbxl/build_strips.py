"""Build the monitor's real ECG strips from PTB-XL (PhysioNet, CC BY 4.0).

PTB-XL: Wagner et al., Scientific Data 7, 154 (2020); https://physionet.org/content/ptb-xl/1.0.3/

  python3 scripts/ptbxl/build_strips.py <workdir>

Downloads the metadata and only the records it needs (500 Hz) into <workdir>,
picks clean, human-validated recordings per rhythm, takes lead II, trims each
to whole beats (cut in diastole) so it loops without a seam, downsamples to
250 Hz, and writes public/ecg/ptbxl/<id>.json plus the index for
src/components/clinical/ecg-strips.ts (printed to stdout).

Needs numpy and scipy. Not run in CI; the output is committed.
"""
import ast, csv, json, os, random, sys, urllib.request
import numpy as np
from scipy.signal import butter, filtfilt, find_peaks

BASE = "https://physionet.org/files/ptb-xl/1.0.3/"
FS, OUT_FS = 500, 250
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "public", "ecg", "ptbxl")
WORK = sys.argv[1]
RHYTHM_CODES = {"SR", "AFIB", "STACH", "SBRAD", "SARRH", "AFLT", "SVTAC", "PSVT", "BIGU", "TRIGU", "PACE", "SVARR"}
INFERIOR = ["IMI", "ILMI", "IPLMI", "IPMI", "INJIN", "INJIL"]


def fetch(rel):
    path = os.path.join(WORK, rel)
    if not os.path.exists(path) or os.path.getsize(path) == 0:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(BASE + rel, path)
    return path


def candidates():
    rows = list(csv.DictReader(open(fetch("ptbxl_database.csv"))))
    out = {k: [] for k in ["sinus", "tachycardia", "bradycardia", "afib", "stemi"]}
    for r in rows:
        if any(r[k].strip() for k in ["static_noise", "burst_noise", "electrodes_problems", "pacemaker"]):
            continue
        c = ast.literal_eval(r["scp_codes"])
        rc = {k for k in c if k in RHYTHM_CODES}
        eid = int(r["ecg_id"])
        if any(c.get(k, 0) >= 50 for k in INFERIOR) and (
            r["infarction_stadium1"] in ("Stadium I", "Stadium I-II") or "INJIN" in c or "INJIL" in c
        ) and not rc & {"AFIB", "AFLT", "PACE"} and "CLBBB" not in c and "CRBBB" not in c:
            out["stemi"].append(eid)
        if r["validated_by_human"] != "True" or r["baseline_drift"].strip() or r["extra_beats"].strip():
            continue
        mi = any(k.endswith("MI") or k.startswith("INJ") for k in c)
        if c.get("NORM", 0) >= 100 and rc == {"SR"}: out["sinus"].append(eid)
        if rc == {"STACH"} and not mi: out["tachycardia"].append(eid)
        if rc == {"SBRAD"} and not mi: out["bradycardia"].append(eid)
        if rc == {"AFIB"} and not mi: out["afib"].append(eid)
    return out


def lead2(eid):
    f = f"{eid:05d}"
    rel = f"records500/{eid // 1000 * 1000:05d}/{f}_hr"
    fetch(rel + ".hea")
    raw = np.fromfile(fetch(rel + ".dat"), dtype="<i2").reshape(-1, 12)
    b, a = butter(2, [0.5, 40], btype="band", fs=FS)
    return filtfilt(b, a, raw[:, 1] / 1000.0)  # mV


def measure(x):
    pk, _ = find_peaks(x, distance=int(0.3 * FS), height=np.percentile(x, 98) * 0.5)
    if len(pk) < 4: return None
    rr = np.diff(pk) / FS
    st = [x[p + 60 : p + 70].mean() - x[p - 40 : p - 20].mean() for p in pk[1:-1]]  # J+60 ms vs PR
    return dict(pk=pk, hr=60 / rr.mean(), irr=rr.std() / rr.mean(), st=float(np.median(st)),
                r=float(np.median(x[pk])), noise=float(np.median(np.abs(np.diff(x, 2)))) * 1000)


RULES = {
    "sinus": lambda m: m["irr"] < 0.06 and m["noise"] < 0.5 and m["r"] >= 0.45,
    "tachycardia": lambda m: m["irr"] < 0.04 and m["noise"] < 0.6 and m["r"] >= 0.45,
    "bradycardia": lambda m: m["irr"] < 0.07 and m["noise"] < 0.5 and m["r"] >= 0.45,
    "afib": lambda m: m["irr"] >= 0.12 and m["noise"] < 0.7 and m["r"] >= 0.4,
    "stemi": lambda m: m["st"] >= 0.15 and m["irr"] < 0.08 and m["noise"] < 1.0,
}

random.seed(1)
os.makedirs(OUT, exist_ok=True)
index = []
for rhythm, ids in candidates().items():
    sample = ids if rhythm == "stemi" or len(ids) <= 30 else random.sample(ids, 30)
    good = []
    for eid in sample:
        x = lead2(eid)
        m = measure(x)
        if m and RULES[rhythm](m): good.append((eid, x, m))
    good.sort(key=lambda g: g[2]["hr"])
    if len(good) > 6: good = [good[round(i * (len(good) - 1) / 5)] for i in range(6)]
    for eid, x, m in good:
        pk = m["pk"]; rr = np.diff(pk)
        seg = x[int(pk[1] - 0.35 * rr[0]) : int(pk[-1] - 0.35 * rr[-1])][:: FS // OUT_FS]
        seg = seg - np.linspace(seg[0], seg[-1], len(seg))  # both ends at 0: the loop has no seam
        beats = len(pk) - 2
        secs = len(seg) / OUT_FS
        sid = f"ptbxl-{eid:05d}"
        json.dump({"id": sid, "fs": OUT_FS, "unit": "10uV", "lead": "II", "source": "PTB-XL 1.0.3, PhysioNet, CC BY 4.0",
                   "samples": [int(round(v * 100)) for v in seg]},
                  open(os.path.join(OUT, f"{sid}.json"), "w"), separators=(",", ":"))
        index.append({"id": sid, "rhythm": rhythm, "hr": round(60 * beats / secs), "beats": beats, "seconds": round(secs, 2)})
for s in index:
    print(f'  {{ id: "{s["id"]}", rhythm: "{s["rhythm"]}", hr: {s["hr"]}, beats: {s["beats"]}, seconds: {s["seconds"]} }},')
