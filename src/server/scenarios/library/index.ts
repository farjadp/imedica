// Every scenario Imedica ships with. New ones arrive as "In review": a
// physician checks them in the editor and a second physician publishes.
import { severeAsthma } from "./asthma";
import { anaphylaxis, hypoglycemia, stemi } from "./core";
import { limbHemorrhage } from "./hemorrhage";
import { opioidOverdose } from "./opioid";
import { paediatricSeizure } from "./seizure";
import { acuteStroke } from "./stroke";
import type { ScenarioDef } from "./types";

export const LIBRARY: ScenarioDef[] = [
  stemi,
  anaphylaxis,
  hypoglycemia,
  opioidOverdose,
  acuteStroke,
  paediatricSeizure,
  severeAsthma,
  limbHemorrhage,
];
