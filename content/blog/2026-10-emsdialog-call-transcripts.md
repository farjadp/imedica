---
month: 2026-10
extra: true
title: "EMSDialog: 149 real EMS calls, 1,000 synthetic ones, and how we use them"
slug: emsdialog-call-transcripts
excerpt: "EMSDialog is an open set of EMS call conversations, both real and synthetic. We use it inside the company to study how calls unfold and to draft scenarios. Here's exactly how, and the licence limit we work within."
keyTakeaway: "EMSDialog is an open research dataset of EMS conversations: 149 de-identified real calls (89 for training, 60 for testing) and 1,000 synthetic ones, each linked to a protocol. It's licensed for non-commercial use only. Imedica uses it in an internal tool where AI drafts a rough scenario from a call, and nothing from it reaches customers."
category: privacy-data
tags: [emsdialog, call-transcripts, scenarios, datasets, licensing]
focusKeyword: EMSDialog
metaDescription: "EMSDialog explained: 149 real and 1,000 synthetic EMS call transcripts, how Imedica uses them internally to draft scenarios, and its non-commercial licence."
faq:
  - q: What is EMSDialog?
    a: "A research dataset of conversations from EMS calls, published by a university group. It has 149 de-identified real calls and 1,000 synthetic calls, each labelled with the EMS protocol that applied, such as chest pain or a suspected cardiac problem."
  - q: Are Imedica scenarios built from real 911 calls?
    a: "Not the ones paramedics train on. Every published scenario is written and reviewed by people. Internally, we let AI draft rough scenarios from EMSDialog calls to help our writers, and those drafts stay internal."
  - q: Can EMSDialog be used commercially?
    a: "Its licence is Creative Commons Attribution-NonCommercial 4.0, so commercial use needs the authors' permission. That's why our use stays internal, and why we'd ask the authors first before anything built from it shipped."
sources:
  - title: "EMSDialogue Datasets on Hugging Face"
    url: https://huggingface.co/datasets/Xueren/EMSDialogue-Datasets
  - title: "EMSDialog project page"
    url: https://uva-dsa.github.io/EMSDialog/
---

Paramedic scenarios usually start from a writer's memory of a call. That's valuable, but memory tidies things up. Real calls aren't tidy: the history comes in pieces, a family member answers for the patient, and the important detail turns up halfway through. EMSDialog is a collection of conversations that show what calls actually sound like.

## What EMSDialog is

EMSDialog is an open research dataset from a university group that studies AI support for EMS crews. It has two parts:

- **149 real calls**, de-identified, with conversations between responders, patients and bystanders. The authors split them into 89 for training and 60 for testing.
- **1,000 synthetic calls**, generated to look like real ones, for researchers who need more volume.

Each call is a series of turns (who spoke and what they said), labelled with the **EMS protocol** that applied, such as "medical: chest pain, cardiac suspected". Researchers use it to teach AI to follow a conversation and suggest the likely protocol.

The licence is **CC BY-NC 4.0**: free for research and other non-commercial use, with attribution. Commercial use needs the authors' permission.

## Why a 149-call dataset matters

By dataset standards, 149 is small. What matters is that these conversations are real. Synthetic calls are useful for volume, but they tend to read like a textbook. The real ones show the hesitations, the corrections and the information that comes in the wrong order, which is exactly what makes scene assessment hard. If we want scenarios that feel like a real call, we need to study real calls.

## How Imedica uses EMSDialog

Inside Imedica, administrators can import EMSDialog into an internal **call library**:

1. **Import.** We download the dataset when the import runs and never copy it into our public code. Calls with fewer than four usable turns are skipped, and very long turns are shortened.
2. **Read.** Writers can browse calls by protocol and read them turn by turn, to see how a given type of call tends to unfold.
3. **Draft.** A writer can ask Claude to turn a call into a **draft scenario**: suggested patient states, plausible actions and a debrief outline. The draft is saved with the status *Draft*, and it's only a starting point.
4. **Rewrite and review.** Before any scenario can be published, a physician rewrites it against Canadian directives, and a second person reviews it. That's the same two-person rule every Imedica scenario follows.

Like the question bank, the whole feature sits behind an internal switch. Customer accounts can't see the call library, and no scenario published to customers today came from EMSDialog.

## The limits

- **Licence.** Because of the non-commercial term, our use is internal research and design. If we ever wanted to ship something substantially based on these calls, we'd ask the authors for permission first.
- **Setting.** The calls come from a US EMS system. Protocol names, scope of practice and the system around them differ from Canadian services.
- **Coverage.** 149 real calls can't cover the full range of calls. Rare, high-risk presentations, the ones simulation is most useful for, are barely there.
- **AI drafts are drafts.** A language model can invent clinical details that sound right but aren't. That's why the physician rewrite isn't optional.

## For training leads

If you write your own scenarios, try this: before writing the branches, write down the first five things the patient or a bystander would actually say, in their own words. It's a cheap way to build in the messiness a real call has, and it's what EMSDialog does for our writers.

## The takeaway

EMSDialog gives Imedica's scenario writers 149 real EMS conversations and 1,000 synthetic ones to study and draft from. Its non-commercial licence keeps our use internal. Every scenario a paramedic trains on is still written, rewritten and approved by people.

*Written by the Imedica team. Dataset figures checked against the EMSDialog documentation on Hugging Face, October 2026.*
