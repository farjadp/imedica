---
month: 2026-10
extra: true
title: "Imedica's training data: everything we have, and what it isn't"
slug: imedica-training-data-inventory
excerpt: "A plain count of every dataset behind Imedica: what we generate ourselves, what we borrow from open research, how big each one really is, and which ones customers never see."
keyTakeaway: "Imedica's training data comes from two places. The first is the data the platform creates: physician-written scenarios and the decision records of each run. The second is three open research datasets: PTB-XL (21,799 real ECGs), EMS-MCQA (18,602 exam-style questions) and EMSDialog (149 real and 1,000 synthetic call transcripts). Only PTB-XL reaches customers today."
category: privacy-data
tags: [training-data, datasets, ptb-xl, ems-mcqa, emsdialog]
focusKeyword: Imedica training data
metaDescription: "Imedica training data in plain numbers: our own scenario and decision records, plus PTB-XL, EMS-MCQA and EMSDialog, and which ones customers actually see."
faq:
  - q: How much data does Imedica have?
    a: "There are three open datasets, about 40,000 records between them: 21,799 ECG recordings, 18,602 multiple-choice questions and 1,149 call transcripts. There is also the data Imedica generates itself: eight physician-built scenarios and a decision record for every training run. That second set grows as services train."
  - q: Does Imedica use real patient data?
    a: "Not from Canadian patients. The ECGs and the 149 real call transcripts are de-identified recordings published by research groups for reuse. Scenarios are written by people, and nothing a paramedic does in training is linked to a real patient."
  - q: Which datasets do paramedics actually see?
    a: "Today, only PTB-XL. Its real ECG strips play on the scenario monitor. The question bank and the call transcripts sit behind an internal switch, because their licences don't yet clear them for customers."
sources:
  - title: "PTB-XL, a large publicly available electrocardiography dataset (PhysioNet, version 1.0.3)"
    url: https://physionet.org/content/ptb-xl/1.0.3/
  - title: "EMS-MCQA on Hugging Face"
    url: https://huggingface.co/datasets/Xueren/EMS-MCQA
  - title: "EMSDialogue Datasets on Hugging Face"
    url: https://huggingface.co/datasets/Xueren/EMSDialogue-Datasets
---

Training companies like to say they have "millions of data points". Sometimes the claim holds up. Often it counts every sample of a waveform, or every row of a dataset the company only links to. We would rather publish the real numbers, so this post lists all of Imedica's training data: what we generate ourselves, what we borrow from open research, how big each piece actually is, and what each piece is cleared for.

The short version: we have tens of thousands of high-quality records, not millions. Most of the long-term value is in the data the platform creates as paramedics train.

## Imedica training data at a glance

| Source | What it is | Size | Who sees it |
|---|---|---|---|
| Imedica scenarios | Branching calls written and reviewed by people | 8 scenarios, each with states, actions, rules and debriefs | Paramedics |
| Imedica run records | Every decision in every training run | Grows with use | Training leads, as groups of five or more |
| PTB-XL | Real 12-lead ECG recordings | 21,799 recordings from 18,869 patients | Paramedics (30 strips on the monitor) |
| EMS-MCQA | EMS exam-style multiple-choice questions | 18,602 questions | Internal only |
| EMSDialog | EMS call conversations | 149 real (de-identified) and 1,000 synthetic | Internal only |

All three open datasets together hold about 40,000 records. Each one is described in its own post in this series.

## The data we create ourselves

**Scenarios.** Each Imedica scenario is a branching call: a set of patient states, the actions a crew can take in each state, physician-written rules that score those actions, and a debrief. A scenario can't go live until a second person has reviewed it. Today the library holds eight: three founding scenarios and five newer calls (severe asthma, catastrophic bleeding, opioid toxicity, seizure and stroke). All of them are still waiting for physician sign-off before the pilot.

**Run records.** Each time a paramedic works through a scenario, Imedica records every decision: which action they chose, in which patient state, what the rule engine ruled (helpful, neutral, harmful or a missed requirement), and how many seconds in it happened. A second, de-identified copy goes to a separate analytics store. In that copy the paramedic is a one-way hash, timestamps are cut down to the week and experience is stored only as a range. Team reports only show groups of five or more people, so no one's individual result can be picked out.

**Pre/post assessments.** Services can run the same set of scenarios and questions before and after a training block. The paired before-and-after results are the evidence a service needs to show that training changed anything.

**Physician reviews.** Every AI-written debrief can be approved or flagged by a physician, and each review is saved alongside it. Over time that becomes a record of where AI explanations hold up and where they don't.

This is the data that will grow. A month into a pilot, it will be the most useful data we have.

## The data we borrow

We use three open research datasets. We picked each one because it makes the training more realistic, not because it makes a number look bigger.

- **PTB-XL** gives the monitor real ECGs instead of drawn ones.
- **EMS-MCQA** is a large bank of EMS exam-style questions that educators can draw on when drafting assessments.
- **EMSDialog** holds real and synthetic EMS call transcripts, which we use to study how calls unfold and to draft new scenarios.

None of the three is Canadian, and none of them includes Imedica learners.

## What our data isn't

To be clear about the limits:

- **It isn't millions of samples.** If you count every voltage reading in PTB-XL, the number is in the hundreds of millions. That would be a misleading way to describe what we have, so we don't.
- **It isn't Canadian patient data.** We don't hold patient charts, and we have no data-sharing agreement with any Canadian service or registry yet.
- **It isn't all cleared for customers.** Two of the three open datasets sit behind an internal switch. The posts on EMS-MCQA and EMSDialog explain why.

## For training leads

Before you adopt any training platform that talks about data, ask four questions:

1. Where does each dataset come from, and under what licence?
2. What exactly gets recorded when my paramedics train, and who can see it?
3. What is the smallest group a report will show?
4. Where is the data hosted?

We've answered the first three here and in our privacy pages. On the fourth: before any service's paramedics train on Imedica, their data will be hosted in Canada.

## The takeaway

Imedica's data is modest in size and clear about where it comes from. The open datasets bring realism to training today. The decision records from Canadian paramedics, gathered with privacy built in, are what will make the platform better over time.

*Written by the Imedica team. Dataset figures checked against each dataset's published documentation, October 2026.*
