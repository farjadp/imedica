---
month: 2026-10
extra: true
title: "PTB-XL: the open ECG dataset behind Imedica's monitor"
slug: ptb-xl-ecg-dataset
excerpt: "PTB-XL is one of the largest open 12-lead ECG datasets. Here's what it contains, how we chose 30 strips from it, and why one lead on a monitor isn't a 12-lead diagnosis."
keyTakeaway: "PTB-XL is an open dataset of 21,799 ten-second 12-lead ECGs from 18,869 patients, labelled by cardiologists and published on PhysioNet under CC BY 4.0. Imedica uses 30 lead II strips from it (sinus rhythm, sinus tachycardia, sinus bradycardia, atrial fibrillation and inferior STEMI patterns) so the scenario monitor shows real ECGs."
category: privacy-data
tags: [ptb-xl, ecg, physionet, datasets, monitor]
focusKeyword: PTB-XL ECG dataset
metaDescription: "The PTB-XL ECG dataset explained: 21,799 real 12-lead ECGs, how Imedica picked 30 lead II strips for its monitor, and the limits of one lead."
faq:
  - q: What is PTB-XL?
    a: "A public dataset of 21,799 clinical 12-lead ECGs, each 10 seconds long, from 18,869 patients. The recordings were made in Germany between 1989 and 1996, labelled by cardiologists, and released on PhysioNet in 2020 for research and reuse."
  - q: Can PTB-XL be used in a commercial product?
    a: "Yes, with attribution. It's published under the Creative Commons Attribution 4.0 licence, which allows commercial use as long as the source is credited. Imedica shows that credit on the monitor."
  - q: Does Imedica use all 12 leads?
    a: "No. The monitor shows lead II, as a cardiac monitor would. A single lead is fine for rate and rhythm, but it can't confirm or rule out a STEMI. That still needs a 12-lead."
sources:
  - title: "PTB-XL, a large publicly available electrocardiography dataset (PhysioNet, version 1.0.3)"
    url: https://physionet.org/content/ptb-xl/1.0.3/
  - title: "Wagner et al., PTB-XL, a large publicly available electrocardiography dataset, Scientific Data 7, 154 (2020)"
    url: https://doi.org/10.1038/s41597-020-0495-6
---

Most training monitors draw ECGs the way a textbook does: clean baseline, identical beats, no noise. Real monitors don't look like that. If the first atrial fibrillation you see on a real monitor looks nothing like the one you practised on, the practice didn't prepare you. That's why Imedica's monitor plays real recordings from the PTB-XL ECG dataset.

## What the PTB-XL ECG dataset is

PTB-XL is one of the largest freely available collections of clinical ECGs:

- **21,799 recordings** from **18,869 patients**, each a 10-second, 12-lead ECG.
- Recorded between **1989 and 1996** and curated by the Physikalisch-Technische Bundesanstalt (PTB), Germany's national metrology institute.
- **Labelled by cardiologists** using standard ECG diagnostic statements (diagnoses, waveform shape and rhythm), with notes on signal quality such as noise, baseline drift and electrode problems.
- Recorded at **500 Hz**, with a 100 Hz version included for convenience.
- Published on **PhysioNet** in 2020 and described in *Scientific Data*. It's licensed **CC BY 4.0**, so it can be used commercially as long as the source is credited.

Researchers mostly use PTB-XL to train and benchmark automatic ECG classifiers. We use it for something simpler: showing paramedics real waveforms.

## How Imedica uses PTB-XL

We don't ship the whole dataset. A script downloads only the recordings it needs and builds **30 strips**, six for each of five patterns:

| Pattern | Strips | Heart rates |
|---|---|---|
| Sinus rhythm | 6 | 55–85 |
| Sinus tachycardia | 6 | 101–121 |
| Sinus bradycardia | 6 | 43–60 |
| Atrial fibrillation | 6 | 52–156 |
| Inferior STEMI pattern | 6 | 72–92 |

Choosing the strips was the careful part:

1. **Start from the labels.** We take only recordings whose cardiologist labels match the pattern clearly. For example, a normal sinus recording has no other rhythm label, and the tachycardia, bradycardia and AF strips have no infarction label.
2. **Leave out messy recordings.** Anything flagged for static or burst noise, electrode problems or a pacemaker is dropped. For the four rhythm groups we also require human validation and no baseline drift or extra beats.
3. **Check the signal ourselves.** We filter lead II and measure rate, regularity and noise. AF strips must actually be irregular. For the STEMI group, which starts from acute inferior infarction labels, we measure ST elevation after the J point and keep only strips where it's clearly there.
4. **Make it loop.** Each strip is cut to whole beats, with the cuts falling between beats, and its ends are levelled so it repeats on the monitor without a visible jump. It's stored at 250 Hz.

In a scenario, the monitor picks the strip closest to the patient's heart rate in that state, and can speed it up or slow it down by up to 25% to match. Every strip shows the credit "ECG: PTB-XL, PhysioNet (CC BY 4.0)".

## What one lead can and can't teach

A teaching point we want to be clear about: the monitor shows **lead II only**, as a cardiac monitor would. That's fine for rate and rhythm practice. It **isn't** a 12-lead ECG. The STEMI strips show ST elevation in an inferior lead, but on a real call you'd still acquire and interpret a 12-lead, and transmit it, according to your service's medical directives. Our scenarios treat the strip as a prompt to do that, not as a replacement for it.

The other limits:

- Recordings are 10 seconds long, so a strip is a few seconds of looped beats, not a continuous trend.
- The patients were in German hospitals decades ago. That's fine for waveform shape, but the dataset doesn't represent a Canadian prehospital population.
- There are no ventricular arrhythmias or arrest rhythms in our set. VF and asystole still use a drawn trace.

## For training leads

If your crews mostly practise rhythms on paper or simulator waveforms, use a few real strips in your next session and ask people to call the rate and rhythm before they see the label. Real noise and baseline wander are part of the skill.

## The takeaway

The PTB-XL ECG dataset gives Imedica's monitor real, cardiologist-labelled waveforms under a licence that clearly allows commercial use. We use 30 carefully chosen lead II strips. They give realism, not diagnostic certainty, and the 12-lead still decides.

*Written by the Imedica team. Dataset figures checked against the PTB-XL documentation on PhysioNet, October 2026.*
