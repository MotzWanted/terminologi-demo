/* ============================================================================
 * pt_001 — single source of truth for the entire 4-pane demo.
 *
 * Patient: 68-year-old female. CKD since 2019 → anemia (Apr 2021) → chest
 * infection (Mar 2024) → amoxicillin → drug rash (ADR) → rectal bleeding
 * (Jun 2024) → colonoscopy → biopsy → sigmoid colon adenocarcinoma.
 *
 * Data flows: note → ICD-10 codes (pane 1) → SNOMED CT (pane 2) → FHIR bundle
 * (pane 3) → clinical-statement timeline (pane 4).
 *
 * ICD-10-CM codes, coding hints, and guideline citations are verified against
 * the real FY-2026 ICD-10-CM tabular list and Official Guidelines, extracted
 * via ml-utils-medical-coding-trie (ICD10CMCodingSystem.load, version 2026).
 * ICD-10-PCS codes are verified against the FY-2026 ICD-10-PCS system.
 * SNOMED CT codes, FHIR resources, and concept maps are hand-authored from
 * real identifiers. They will be verified against a real Corti pipeline run
 * (Path C) before the demo.
 * ========================================================================== */

const PT001 = {

  /* ---- Patient demographics ---- */
  patient: {
    id: "pt_001",
    name: "Margrete Sørensen",
    age: 68,
    sex: "F",
    mrn: "MRN-001-68F",
    snomedVersion: "SNOMED CT International Edition 20260501",
  },

  /* ---- Clinical note — raw discharge summary (MIMIC-style noise level) ---- */
  note: {
    title: "Discharge Summary",
    date: "2024-06-15",
    raw: true,
    text:
`Admission Date: 06/10/2024     Discharge Date: 06/15/2024
Date of Birth: 01/01/1956     Sex: F
Service: Gastroenterology     Ward: GI step-down, bed 14
Attending: [**Attending 1234**]
Author: FY1 on behalf of cons.     Status: dictated, not read
Source: pt, daughter, GP referral letter (2WW), prev renal clinic letters
*** HPI copied fwd from admission clerking 06/10 - edited ***

CHIEF COMPLAINT:
2/52 hx rectal bleeding

HPI:
68F pt w/ PMHx significant for CKD3b (since 2019) presents c/o 2 weeks
PR bleeding. Pt has been increasingly tired over the past several months,
noted to be anaemic back in Apr 2021 — likely 2/2 her renal disease
(Hb 9.1, ref 12.0-16.0). She was treated for a chest infection in early
Mar 2024, started on amoxicillin 500mg TDS. 3 days after starting the
abx she developed a generalized rash — amox stopped early, rash
resolved over ~1wk.

2 weeks PTA she noticed rectal bleeding, mixed w/ stool, no pain.
D-dimer sent (0.21, ref <0.5) — PE considered but r/o on basis of low
Wells score + neg D-dimer. No SOB, no chest pain, no calf swelling.

Referred in by GP on 2WW pathway after 2nd episode of PR bleed. Wt stable
per pt (not weighed at home). Appetite "ok-ish". ?change in bowel habit -
pt unsure, "maybe a bit looser". No N/V. No fevers/rigors/night sweats.
No abdo pain at rest. BO daily, PU normally, no dysuria.

PAST MEDICAL HISTORY:
- CKD stage 3b — dx 2019, nephrology f/u
- Anaemia — 2/2 renal disease, Hb 9.1 (04/2021)
- Chest infection — Mar 2024, resolved
- No previous GI endoscopy
PSH: nil of note

SOCIAL HISTORY:
Retired schoolteacher. Married, lives w/ husband in own house. Indep
ADLs, still drives. Daughter lives locally, v. involved, attended ward
round. Never smoker. EtOH "a glass of wine at weekends".

FAMILY HISTORY:
Father — MI in his 50s. No other significant FHx.
Mother d. aged 84 (natural causes per pt).

MEDICATIONS ON ADMISSION:
1. Amoxicillin 500mg TDS po     (stopped early — rash)
2. Paracetamol 1g PRN po (OTC, "now and then")
3. ?Ferrous sulphate in the past - stopped 2022, pt not sure why
Med rec vs GP summary record: no other discrepancies.

ALLERGIES:  NKDA at present — ?penicillin rash to be documented

PHYSICAL EXAM:
VS: T 36.8  HR 82  BP 142/88  RR 16  SpO2 97% RA   NEWS 1 (BP)
Wt 71kg  Ht 164cm
Gen: alert, oriented x3, no acute distress
CVS: HS I+II+0, no murmurs. Resp: chest clear, GAE bilat.
Abd: soft, mild LLQ tenderness, no guarding/rebound. DRE: brown stool,
     gross blood present. No masses palpable.
Ext: no edema, no calf tenderness
Neuro: grossly intact

LABS (06/10):
WBC 7.2    Hb 10.1    Plt 245    Cr 1.8    eGFR 38
D-dimer 0.21 (neg, <0.5)    INR 1.1
LFTs: AST 22  ALT 18  Alk Phos 110  Bili 0.6    CEA 18.5 (H)
Na 139  K 4.6  Urea 9.8  CRP 4  MCV 88  Ferritin 85
G&S x2 sent. Urine dip: NAD. ECG: NSR 78, no acute changes.
Repeat FBC 06/12: Hb 9.8 - no transfusion req.

IMAGING:
CT abd/pelvis w/ contrast: 4cm mass in sigmoid colon, concerning for
malignancy. No mets identified. No LAD beyond regional.
(IV fluids pre/post contrast per renal protocol. Cr rechecked 48h - stable.)
CT chest (non-contrast): no pulm nodules. Formal report to follow.

PROCEDURES:
06/10 — Colonoscopy: 4cm mass in the sigmoid, biopsies taken. Reached
cecum, good prep. Also noted scattered diverticula.
Bowel prep: Moviprep split dose, tolerated. Sedation: midaz 2mg + fent 50mcg.

HOSPITAL COURSE:
Day 1 (06/10): Admitted, colonoscopy same day. Biopsies sent to path.
Day 2-3 (06/11-12): Awaiting pathology.
  Mobilising indep on ward, eating & drinking. No further PR bleed
  overnight per nursing. Renal reg (phone): happy, no change to mgmt.
Day 4 (06/14): Path returned — adenocarcinoma of the sigmoid. Staging
workup initiated. KRAS wt. AJCC 8th ed: pT3 N1a M0, Stage IIIB, Grade 2.
Discussed w/ oncology MDT — plan for surgical resection.
  Pt informed of dx w/ daughter present. Colorectal CNS contact details
  given. Pt tearful but coping, good support at home.
Day 5 (06/15): Well, obs stable, for d/c.

ASSESSMENT:
1. Sigmoid colon adenocarcinoma — newly dx, staged IIIB
2. CKD3b — stable, nephrology aware
3. Anaemia of CKD — Hb improved to 10.1
4. Drug rash s/p amoxicillin — resolved. ?adverse drug reaction, probable
   per WHO-UMC (plausible timing, resolved on withdrawal, other causes
   excluded). Penicillin allergy to be documented in chart.
5. PE r/o — low Wells + neg D-dimer
6. FHx: father MI in 50s

DISCHARGE PLAN:
- Refer to surg onc + onc MDT for resection planning
- Document penicillin allergy in EHR
- Continue CKD-anemia mgmt w/ nephrology
- F/u in clinic 2/52 w/ pathology results
- TTOs: nil new. Paracetamol PRN as before.
- Safety-netting: return if heavy PR bleed, dizziness or SOB
- GP pls: repeat FBC + U&E in 2/52; ?chase penicillin allergy coding
- cc: GP, renal clinic, colorectal CNS

[**FY1 5678**] for [**Attending 1234**]`,
  },

  /* ---- ICD-10-CM predictions (pane 1) ----
   * Each card: code, display, evidenceSpans (1-3 from the note), alternatives
   * (candidate codes that were considered and rejected with reasons), and a
   * guideline citation with drill-down sub-sections.
   */
  icd10cm: [
    {
      code: "C18.7",
      display: "Malignant neoplasm of sigmoid colon",
      system: "ICD-10-CM",
      chapter: "2. Neoplasms (C00-D49)",
      role: "principal diagnosis",
      evidenceSpans: ["adenocarcinoma of the sigmoid", "4cm mass in sigmoid colon", "Sigmoid colon adenocarcinoma"],
      alternatives: [
        {code:"C18.9", display:"Malignant neoplasm of colon, unspecified", reason:"Site specified as sigmoid — use the more specific code"},
        {code:"C19", display:"Malignant neoplasm of rectosigmoid junction", reason:"Mass located in sigmoid, not at the junction"},
      ],
      codingHints: {
        mutuallyExclusive: ["malignant neoplasm of rectosigmoid junction (C19)"],
      },
      guideline: {
        sectionId: "I.C.2.a",
        breadcrumb: ["Section I", "C. Chapter-Specific", "2. Neoplasms", "a. Admission/Encounter for treatment of primary site"],
        title: "Admission/Encounter for treatment of primary site",
        excerpt: "If the malignancy is chiefly responsible for occasioning the patient admission/encounter and treatment is directed toward the malignancy, the designation of principal or first-listed diagnosis will be the malignancy.",
        codesReferenced: ["C18.7"],
        subSections: [
          {title: "§I.C.2.e.1 — Surgical removal of neoplasm", excerpt: "When an episode of care involves the surgical removal of a neoplasm, primary or secondary site, followed by adjunct chemotherapy or radiation treatment during the same episode of care, the code for the neoplasm should be assigned as principal or first-listed diagnosis."},
        ],
      },
    },
    {
      code: "N18.32",
      display: "Chronic kidney disease, stage 3b",
      system: "ICD-10-CM",
      chapter: "14. Diseases of the genitourinary system (N00-N99)",
      role: "comorbidity",
      evidenceSpans: ["CKD3b (since 2019)", "CKD stage 3b — dx 2019"],
      alternatives: [
        {code:"N18.9", display:"CKD, unspecified", reason:"Stage 3b explicitly documented — assign the specific code"},
        {code:"N18.3", display:"CKD, stage 3", reason:"Stage 3b (not just stage 3) documented — N18.32 is the correct substage code"},
      ],
      guideline: {
        sectionId: "I.C.14.a.1",
        breadcrumb: ["Section I", "C. Chapter-Specific", "14. Genitourinary", "a. Chronic kidney disease", "1. Stages of CKD"],
        title: "Stages of chronic kidney disease (CKD)",
        excerpt: "The ICD-10-CM classifies CKD based on severity. The severity of CKD is designated by stages 1-5. Stage 2, code N18.2, equates to mild CKD; stage 3, codes N18.30-N18.32, equate to moderate CKD; and stage 4, code N18.4, equates to severe CKD. Code N18.6, End stage renal disease (ESRD), is assigned when the provider has documented end-stage renal disease (ESRD).",
        codesReferenced: ["N18.32"],
        subSections: [
          {title: "§I.C.14.a.3 — CKD with other conditions", excerpt: "Patients with CKD may also suffer from other serious conditions, most commonly diabetes mellitus and hypertension. The sequencing of the CKD code in relationship to codes for other contributing conditions is based on the conventions in the Tabular List."},
          {title: "§I.C.9.a.2 — Hypertensive CKD", excerpt: "Assign codes from category I12 when both hypertension and a condition classifiable to category N18 are present. The appropriate N18 code should be used as a secondary code with I12 to identify the stage of CKD."},
        ],
      },
    },
    {
      code: "D63.1",
      display: "Anemia in chronic kidney disease",
      system: "ICD-10-CM",
      chapter: "3. Diseases of the blood (D50-D89)",
      role: "comorbidity (manifestation)",
      evidenceSpans: ["anaemic back in Apr 2021", "likely 2/2 her renal disease", "Anaemia — 2/2 renal disease"],
      alternatives: [
        {code:"D63.0", display:"Anemia in neoplastic disease", reason:"Anemia documented as secondary to CKD, not neoplasm — D63.1 is the correct etiology-specific code"},
        {code:"D50.9", display:"Iron deficiency anemia, unspecified", reason:"No evidence of iron deficiency — anemia attributed to CKD"},
      ],
      codingHints: {
        role: "manifestation",
        etiology: ["underlying chronic kidney disease (CKD) (N18.-)"],
      },
      guideline: {
        sectionId: "I.A.13",
        breadcrumb: ["Section I", "A. Conventions", "13. Etiology/manifestation convention"],
        title: "Etiology/manifestation convention (\"code first\", \"use additional code\")",
        excerpt: "Certain conditions have both an underlying etiology and multiple body system manifestations due to the underlying etiology. For such conditions, the ICD-10-CM has a coding convention that requires the underlying condition be sequenced first, if applicable, followed by the manifestation. Wherever such a combination exists, there is a \"use additional code\" note at the etiology code, and a \"code first\" note at the manifestation code.",
        codesReferenced: ["D63.1", "N18.32"],
        subSections: [
          {title: "Sequencing rule", excerpt: "The underlying condition (N18.32, CKD stage 3b) is sequenced first, followed by the manifestation (D63.1, anemia in CKD). Manifestation codes are never permitted as principal/first-listed diagnosis."},
        ],
      },
    },
    {
      code: "T36.0X5A",
      display: "Adverse effect of penicillins, initial encounter",
      system: "ICD-10-CM",
      chapter: "19. Injury, poisoning (S00-T88)",
      role: "secondary diagnosis",
      manifestation: "L27.0",
      manifestationDisplay: "Generalized skin eruption due to drug",
      evidenceSpans: ["generalized rash", "amox stopped early", "Drug rash s/p amoxicillin", "adverse drug reaction, probable"],
      alternatives: [
        {code:"T36.0X5D", display:"Adverse effect of penicillins, subsequent encounter", reason:"This is the initial encounter for the ADR — use 5th char A, not D"},
        {code:"T36.0X1A", display:"Accidental poisoning by penicillins", reason:"This is an adverse effect (correct therapeutic use), not accidental poisoning — use 5th char 5, not 1"},
      ],
      guideline: {
        sectionId: "I.C.19.e.5.a",
        breadcrumb: ["Section I", "C. Chapter-Specific", "19. Injury, poisoning", "e. Adverse effects", "5. Adverse Effect"],
        title: "Adverse Effect",
        excerpt: "When coding an adverse effect of a drug that has been correctly prescribed and properly administered, assign the appropriate code for the nature of the adverse effect followed by the appropriate code for the adverse effect of the drug (T36-T50). The code for the drug should have a 5th or 6th character \"5\" (for example T36.0X5-).",
        codesReferenced: ["T36.0X5A", "L27.0"],
        subSections: [
          {title: "§I.A.4 — Placeholder character X", excerpt: "The ICD-10-CM utilizes a placeholder character \"X\". The \"X\" is used as a placeholder at certain codes to allow for future expansion. An example of this is at the poisoning, adverse effect and underdosing codes, categories T36-T50. Where a placeholder exists, the X must be used in order for the code to be considered a valid code."},
          {title: "§I.C.19.e — Combination codes", excerpt: "Codes in categories T36-T65 are combination codes that include the substance that was taken as well as the intent. No additional external cause code is required for poisonings, toxic effects, adverse effects and underdosing codes."},
        ],
      },
    },
    {
      code: "L27.0",
      display: "Generalized skin eruption due to drug",
      system: "ICD-10-CM",
      chapter: "12. Skin (L00-L99)",
      role: "manifestation of T36.0X5A",
      pairedWith: "T36.0X5A",
      evidenceSpans: ["generalized rash", "rash\nresolved over ~1wk"],
      alternatives: [
        {code:"L27.1", display:"Dermatitis due to food", reason:"Rash attributed to drug (amoxicillin), not food"},
        {code:"R21", display:"Rash and other nonspecific skin eruption", reason:"A specific drug-related eruption code exists — L27.0 is more specific"},
      ],
      codingHints: {
        role: "root_cause",
        manifestation: ["code for adverse effect, if applicable, to identify drug (T36-T50 with fifth or sixth character 5)"],
      },
      guideline: {
        sectionId: "I.C.19.e.5.a",
        breadcrumb: ["Section I", "C. Chapter-Specific", "19. Injury, poisoning", "e. Adverse effects", "5. Adverse Effect"],
        title: "Adverse Effect — nature of the adverse effect coded first",
        excerpt: "When coding an adverse effect of a drug that has been correctly prescribed and properly administered, assign the appropriate code for the nature of the adverse effect followed by the appropriate code for the adverse effect of the drug (T36-T50).",
        codesReferenced: ["L27.0", "T36.0X5A"],
        subSections: [
          {title: "§I.C.19.e.1 — Do not code from Table of Drugs", excerpt: "Do not code directly from the Table of Drugs and Chemicals. Always refer back to the Tabular List. L27.0 was verified in the Tabular List, not assigned directly from the Table of Drugs."},
        ],
      },
    },
    {
      code: "J06.9",
      display: "Acute upper respiratory infection, unspecified",
      system: "ICD-10-CM",
      chapter: "10. Respiratory (J00-J99)",
      role: "resolved condition (historical)",
      evidenceSpans: ["treated for a chest infection in early\nMar 2024", "Chest infection — Mar 2024, resolved"],
      alternatives: [
        {code:"J22", display:"Unspecified acute lower respiratory infection", reason:"'Chest infection' could be upper or lower — without further specification, J06.9 is the default for an acute, unspecified respiratory infection"},
        {code:"J98.8", display:"Other respiratory disorders", reason:"The note documents an acute infection, not a chronic or other respiratory disorder"},
      ],
      codingHints: {
        role: "root_cause",
        manifestation: ["code (B95-B97) to identify infectious agent, if known, such as: respiratory syncytial virus (RSV) (B97.4)"],
      },
      guideline: {
        sectionId: "I.B.2",
        breadcrumb: ["Section I", "B. General Coding Guidelines", "2. Level of Detail in Coding"],
        title: "Level of Detail in Coding",
        excerpt: "Diagnosis codes are to be used and reported at their highest number of characters available and to the highest level of specificity documented in the medical record. ICD-10-CM diagnosis codes are composed of codes with 3, 4, 5, 6 or 7 characters.",
        codesReferenced: ["J06.9"],
        subSections: [
          {title: "§I.B.4 — Signs and symptoms", excerpt: "Codes that describe symptoms and signs, as opposed to diagnoses, are acceptable for reporting purposes when a related definitive diagnosis has not been established by the provider. Here the provider documented \"chest infection\" as a diagnosis, not just a symptom."},
        ],
      },
    },
    {
      code: "Z82.49",
      display: "Family history of ischemic heart disease",
      system: "ICD-10-CM",
      chapter: "21. Factors influencing health status (Z00-Z99)",
      role: "family history (Z code)",
      evidenceSpans: ["Father — MI in his 50s", "father MI in 50s"],
      alternatives: [
        {code:"Z82.41", display:"Family history of sudden cardiac death", reason:"The father had an MI, not sudden cardiac death"},
        {code:"Z82.48", display:"Family history of other ischemic heart disease", reason:"MI is the specific manifestation — Z82.49 is the correct code for family history of MI/ischemic heart disease"},
      ],
      guideline: {
        sectionId: "I.C.21.c.4",
        breadcrumb: ["Section I", "C. Chapter-Specific", "21. Z Codes", "c. History (of)"],
        title: "History (of) — family history Z codes",
        excerpt: "There are two types of history Z codes, personal and family. Family history codes are for use when a patient has a family member(s) who has had a particular disease that causes the patient to be at higher risk of also contracting the disease.",
        codesReferenced: ["Z82.49"],
        subSections: [
          {title: "Z82 — Family history of certain disabilities", excerpt: "Z82: Family history of certain disabilities and chronic diseases (leading to disablement). Z82.49 specifically captures family history of ischemic heart disease and other diseases of the circulatory system."},
          {title: "Sequencing", excerpt: "The reason for the encounter should be sequenced first and the appropriate family history code(s) should be assigned as additional diagnosis. History codes are also acceptable on any medical record regardless of the reason for visit."},
        ],
      },
    },
  ],

  /* ---- ICD-10-PCS predictions (pane 1, procedures tab) ---- */
  /* ---- Guideline PDF page map (pane 1) ----
   * Maps guideline section IDs to page numbers in the FY 2026 ICD-10-CM
   * Official Guidelines PDF. Verified via PyMuPDF against the real PDF.
   */
  guidelinePages: {
    // ICD-10-CM Official Guidelines
    "I.A.4": 7,
    "I.A.13": 10,
    "I.B.2": 12,
    "I.B.4": 13,
    "I.C.2": 32,
    "I.C.2.a": 33,
    "I.C.2.e.1": 35,
    "I.C.9.a.2": 50,
    "I.C.14.a.1": 62,
    "I.C.14.a.3": 63,
    "I.C.19.e": 82,
    "I.C.19.e.1": 82,
    "I.C.19.e.5.a": 83,
    "I.C.21.c.4": 97,
    // ICD-10-PCS Official Guidelines
    "B3.2": 6,
    "B3.4b": 7,
    "B3.5": 7,
    "B3.11a": 9,
    "B3.11c": 10,
  },

  guidelinePdfs: {
    "cm": "icd10-cm-guidelines-fy2026.pdf",
    "pcs": "icd10-pcs-guidelines-fy2026.pdf",
  },

  icd10pcs: [
    {
      code: "0DJD8ZZ",
      display: "Inspection of Lower Intestinal Tract, via natural or artificial opening endoscopic",
      system: "ICD-10-PCS",
      section: "0 — Medical and Surgical",
      bodySystem: "D — Gastrointestinal",
      rootOperation: "Inspection",
      rootOperationDefinition: "Visually and/or manually exploring a body part",
      bodyPart: "Lower Intestinal Tract",
      approach: "Via natural or artificial opening endoscopic",
      date: "06/10",
      evidenceSpans: ["Colonoscopy: 4cm mass in the sigmoid"],
      alternatives: [
        {code:"0DJ08ZZ", display:"Inspection of Upper Intestinal Tract, via natural or artificial opening endoscopic", reason:"Colonoscopy reaches the lower intestinal tract (cecum to rectum), not the upper tract"},
      ],
      codingHints: {
        rootOperation: "Visually and/or manually exploring a body part",
        approach: "Entry of instrumentation through a natural or artificial external opening to reach and visualize the site of the procedure",
      },
      guideline: {
        sectionId: "B3.11a",
        breadcrumb: ["PCS Guidelines", "B. Medical and Surgical", "3. Root Operation", "11. Inspection procedures"],
        title: "Inspection procedures",
        excerpt: "Inspection of a body part(s) performed in order to achieve the objective of a procedure is not coded separately.",
        codesReferenced: ["0DJD8ZZ"],
        subSections: [
          {title: "§B3.11c — Inspection + another procedure, different approach", excerpt: "When both an Inspection procedure and another procedure are performed on the same body part during the same episode, if the Inspection procedure is performed using a different approach than the other procedure, the Inspection procedure is coded separately."},
          {title: "§B3.5 — Overlapping body layers", excerpt: "If root operations such as Excision, Extraction, Repair or Inspection are performed on overlapping layers of the musculoskeletal system, the body part specifying the deepest layer is coded."},
        ],
      },
    },
    {
      code: "0DBN8ZX",
      display: "Excision of Sigmoid Colon, via natural or artificial opening endoscopic, diagnostic",
      system: "ICD-10-PCS",
      section: "0 — Medical and Surgical",
      bodySystem: "D — Gastrointestinal",
      rootOperation: "Excision",
      rootOperationDefinition: "Cutting out or off, without replacement, a portion of a body part",
      bodyPart: "Sigmoid Colon",
      approach: "Via natural or artificial opening endoscopic",
      qualifier: "Diagnostic",
      date: "06/10",
      evidenceSpans: ["biopsies taken", "Biopsies sent to path"],
      alternatives: [
        {code:"0DBN4ZX", display:"Excision of Sigmoid Colon, percutaneous endoscopic, diagnostic", reason:"Biopsy forceps are introduced through the colonoscope working channel via the anus (natural opening), not through a percutaneous puncture — approach 8 is correct, not 4"},
        {code:"0DBN8ZZ", display:"Excision of Sigmoid Colon, via natural or artificial opening endoscopic", reason:"Biopsy is a diagnostic excision — qualifier X (diagnostic) is required to distinguish from therapeutic excision"},
      ],
      codingHints: {
        rootOperation: "Cutting out or off, without replacement, a portion of a body part",
        rootOperationNote: "The qualifier DIAGNOSTIC is used to identify excision procedures that are biopsies",
        bodyPartIncludes: "Rectosigmoid junction; Sigmoid flexure",
        approach: "Entry of instrumentation through a natural or artificial external opening to reach and visualize the site of the procedure",
      },
      guideline: {
        sectionId: "B3.4b",
        breadcrumb: ["PCS Guidelines", "B. Medical and Surgical", "3. Root Operation", "4b. Biopsy followed by more definitive treatment"],
        title: "Biopsy followed by more definitive treatment",
        excerpt: "If a diagnostic Excision, Extraction, or Drainage procedure (biopsy) is followed by a more definitive procedure, such as Destruction, Excision or Resection at the same procedure site, both the biopsy and the more definitive treatment are coded.",
        codesReferenced: ["0DBN8ZX"],
        subSections: [
          {title: "§B3.2 — Multiple procedures", excerpt: "During the same operative episode, multiple procedures are coded if: a. The same root operation is performed on different body parts, or b. The same root operation is repeated in multiple body parts classified to a single ICD-10-PCS body part value."},
        ],
      },
    },
  ],

  /* ---- SNOMED CT clinical statements (pane 2) ----
   * Same 16 statements from the timeline, with full SNOMED CT attributes.
   */
  statements: [
    {id:"fathermi",k:"disease",tag:"disorder",t:"Myocardial infarction",sh:"MI (father)",code:"22298006",codeSystem:"SNOMED CT",fsn:"Myocardial infarction (disorder)",parents:[{code:"64572001",display:"Disease"}],synonyms:["MI","Heart attack","Myocardial infarct"],d:null,dt:"undated",g:"unknown",sub:"family_member",pol:"pos",u:"certain",mod:"actual",ast:"patient reported",det:{"Subject":"family member (father)","Time":"no value at all — only docTimeRel: before","Problem":"—"},src:'"father had an MI in his 50s" — Family History',evidence:"Father — MI in his 50s"},
    {id:"ckd",k:"disease",tag:"disorder",t:"Chronic kidney disease",sh:"CKD",code:"709044004",codeSystem:"SNOMED CT",fsn:"Chronic kidney disease (disorder)",parents:[{code:"90688005",display:"Renal disease"},{code:"267032009",display:"Chronic disease"}],synonyms:["CKD","Chronic renal disease","Chronic renal failure"],d:"2019-01-01",dt:"2019",g:"year",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Finding site":"64033007 |Kidney structure|","Grading":"CKD stage 3b","Verification":"confirmed","Problem":"Chronic kidney disease"},src:'"CKD since 2019" — Past Medical History',evidence:"CKD3b (since 2019)"},
    {id:"anaemia",k:"disease",tag:"disorder",t:"Anemia",sh:"Anemia",code:"271737000",codeSystem:"SNOMED CT",fsn:"Anemia (disorder)",parents:[{code:"64572001",display:"Disease"},{code:"309216001",display:"Blood disease"}],synonyms:["Anaemia","Anemia NOS","Decreased hemoglobin"],d:"2021-04-01",dt:"Apr 2021",g:"month",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Severity":"moderate","Course observed":"worsened","Verification":"confirmed","Problem":"Anemia"},src:'"anaemia, likely secondary to her renal disease" — HPI',evidence:"anaemic back in Apr 2021 — likely 2/2 her renal disease"},
    {id:"fatigue",tag:"finding",k:"phenotype",t:"Fatigue",sh:"Fatigue",code:"84229001",codeSystem:"SNOMED CT",fsn:"Fatigue (finding)",parents:[{code:"398232001",display:"Tiredness"},{code:"22298006",display:"Symptom"}],synonyms:["Tiredness","Exhaustion","Asthenia"],d:"2021-04-01",dt:"Apr 2021",g:"month",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"patient reported",det:{"Severity":"moderate","Course observed":"worsened","Problem":"Anemia"},src:'"increasingly tired over some months" — HPI',evidence:"increasingly tired over the past several months"},
    {id:"hb",tag:"observable",k:"lab",t:"Haemoglobin 9.1 g/dL",sh:"Hb 9.1",code:"119297000",codeSystem:"SNOMED CT",fsn:"Blood hemoglobin level (observable entity)",parents:[{code:"119364003",display:"Hemoglobin level"},{code:"365812005",display:"Blood test finding"}],synonyms:["Hb","Hemoglobin concentration","Blood haemoglobin"],d:"2021-04-11",dt:"Apr 2021",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"device",det:{"Value":"9.1 g/dL","Reference":"12.0–16.0","Interpretation":"low","Problem":"Anemia"},src:'"Hb 9.1" — Labs',evidence:"Hb 9.1"},
    {id:"infection",k:"disease",tag:"disorder",t:"Upper respiratory infection",sh:"Chest infection",code:"312342009",codeSystem:"SNOMED CT",fsn:"Upper respiratory infection (disorder)",parents:[{code:"186400002",display:"Respiratory tract infection"},{code:"64572001",display:"Disease"}],synonyms:["URI","Upper respiratory tract infection","Acute respiratory infection"],d:"2024-03-01",dt:"Mar 2024",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Verification":"confirmed","Problem":"—"},src:'"treated for a chest infection" — HPI',evidence:"treated for a chest infection in early Mar 2024"},
    {id:"amox",tag:"medicinal product",k:"medication",t:"Amoxicillin 500 mg tds",sh:"Amoxicillin",code:"376988004",codeSystem:"SNOMED CT",fsn:"Amoxicillin (product)",parents:[{code:"373873005",display:"Penicillin antibacterial"},{code:"763158003",display:"Medicinal product"}],synonyms:["Amoxil","Amoxicillin","AMX"],d:"2024-03-02",dt:"Mar 2024",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Strength":"500 mg","Route":"oral","Frequency":"tds","Duration":"P7D","Status":"stopped","Change":"stop"},src:'"amoxicillin 500mg tds, stopped early" — Medications',evidence:"amoxicillin 500mg TDS"},
    {id:"rash",k:"disease",tag:"disorder",t:"Eruption of skin",sh:"Rash",code:"271807003",codeSystem:"SNOMED CT",fsn:"Eruption of skin (disorder)",parents:[{code:"129608002",display:"Skin lesion"},{code:"64572001",display:"Disease"}],synonyms:["Rash","Skin eruption","Cutaneous eruption"],d:"2024-03-05",dt:"Mar 2024",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Severity":"moderate","Course observed":"resolved","Interval":"onset 2024-03-05 → abatement 2024-03-09"},src:'"rash three days after starting the antibiotic" — HPI',evidence:"developed a generalized rash — amox stopped early"},
    {id:"bleeding",k:"phenotype",tag:"finding",t:"Hematochezia",sh:"Rectal bleeding",code:"405729008",codeSystem:"SNOMED CT",fsn:"Hematochezia (finding)",parents:[{code:"405729008",display:"Gastrointestinal finding"},{code:"131148009",display:"Bleeding"}],synonyms:["Rectal bleeding","Blood in stool","PR bleeding"],d:"2024-06-01",dt:"1 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Severity":"moderate","Problem":"Colon cancer"},src:'"two weeks of rectal bleeding" — HPI',evidence:"2 weeks PR bleeding"},
    {id:"ddimer",tag:"observable",k:"lab",t:"D-dimer 0.21",sh:"D-dimer neg",code:"714648002",codeSystem:"SNOMED CT",fsn:"D-dimer antigen (observable entity)",parents:[{code:"365812005",display:"Blood test finding"},{code:"396230006",display:"Coagulation test"}],synonyms:["D-dimer","DDIMER","Fibrin degradation product"],d:"2024-06-10",dt:"10 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"device",det:{"Value":"0.21 µg/mL FEU","Reference high":"0.5","Interpretation":"negative"},src:'"D-dimer 0.21" — Labs',evidence:"D-dimer sent (0.21, ref <0.5)"},
    {id:"pe",k:"disease",tag:"disorder",t:"Pulmonary embolism",sh:"PE",code:"59282003",codeSystem:"SNOMED CT",fsn:"Pulmonary embolism (disorder)",parents:[{code:"59282003",display:"Vascular disorder of lung"},{code:"64572001",display:"Disease"}],synonyms:["PE","Pulmonary embolus","Lung embolism"],d:"2024-06-10",dt:"10 Jun",g:"day",sub:"patient",pol:"neg",u:"certain",mod:"actual",ast:"clinician",det:{"Polarity":"negated","Verification":"refuted","Basis":"low Wells score AND negative D-dimer — conjunctive"},src:'"PE considered but excluded" — Assessment',evidence:"PE considered but r/o on basis of low Wells score + neg D-dimer"},
    {id:"colonoscopy",tag:"procedure",k:"procedure",t:"Colonoscopy",sh:"Colonoscopy",code:"73761001",codeSystem:"SNOMED CT",fsn:"Colonoscopy (procedure)",parents:[{code:"73761001",display:"Endoscopy of colon"},{code:"90690006",display:"Endoscopy"}],synonyms:["Colonoscopic examination","Lower GI endoscopy"],d:"2024-06-10",dt:"10 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Method":"inspection","Site":"71854001 |Colon structure|","Device":"colonoscope","Status":"performed","Intent":"diagnostic"},src:'"Colonoscopy 10/06" — Procedures',evidence:"Colonoscopy: 4cm mass in the sigmoid"},
    {id:"mass",k:"phenotype",tag:"finding",t:"Mass of colon",sh:"Sigmoid mass",code:"300848003",codeSystem:"SNOMED CT",fsn:"Mass of colon (finding)",parents:[{code:"300848003",display:"Gastrointestinal finding"},{code:"118600003",display:"Mass finding"}],synonyms:["Colon mass","Tumor of colon","Neoplasm of colon"],d:"2024-06-11",dt:"10 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Finding site":"60184004 |Sigmoid colon structure|","Problem":"Colon cancer"},src:'"4cm mass in the sigmoid" — Findings',evidence:"4cm mass in sigmoid colon"},
    {id:"biopsy",tag:"procedure",k:"procedure",t:"Biopsy of sigmoid colon",sh:"Biopsy",code:"86273004",codeSystem:"SNOMED CT",fsn:"Biopsy of sigmoid colon (procedure)",parents:[{code:"86273004",display:"Biopsy of colon"},{code:"90690006",display:"Endoscopy"}],synonyms:["Sigmoid biopsy","Colonoscopic biopsy"],d:"2024-06-11",dt:"10 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Site":"60184004 |Sigmoid colon structure|","Status":"performed","Intent":"diagnostic"},src:'"biopsies taken" — Procedures',evidence:"biopsies taken"},
    {id:"cancer",tag:"disorder",k:"cancer",t:"Colon adenocarcinoma",sh:"Colon adenoca.",code:"93761005",codeSystem:"SNOMED CT",fsn:"Adenocarcinoma of sigmoid colon (disorder)",parents:[{code:"363346000",display:"Malignant neoplastic disease"},{code:"93761005",display:"Adenocarcinoma of colon"}],synonyms:["Sigmoid adenocarcinoma","Adenocarcinoma of sigmoid colon","Colon adenocarcinoma"],d:"2024-06-14",dt:"14 Jun",g:"day",sub:"patient",pol:"pos",u:"certain",mod:"actual",ast:"clinician",det:{"Topography":"60184004 |Sigmoid colon structure|","Morphology":"35917007 |Adenocarcinoma|","ICD-O-3":"8140/3","Grade":"G2","Stage":"AJCC 8th, pT3 N1a M0, IIIB","Biomarker":"KRAS wild type","Problem":"Colon cancer"},src:'"adenocarcinoma of the sigmoid" — Impression',evidence:"adenocarcinoma of the sigmoid"},
  ],

  /* ---- Typed links between statements (pane 2 + pane 4) ---- */
  links: [
    {ty:"due_to",s:"anaemia",t:"ckd",c:"probable",m:"explicit assertion",n:'"likely secondary to her renal disease"'},
    {ty:"causative_agent",s:"rash",t:"amox",c:"probable",m:"clinician confirmed",n:"WHO-UMC probable — plausible timing, other causes excluded, resolved on withdrawal, no rechallenge"},
    {ty:"after",s:"rash",t:"amox",c:"definite",m:"explicit assertion",n:'"three days after starting the antibiotic" — the weaker claim the text alone supports'},
    {ty:"indication_for",s:"amox",t:"infection",c:"definite",m:"explicit assertion",n:"Intent: therapeutic"},
    {ty:"has_focus",s:"colonoscopy",t:"bleeding",c:"definite",m:"explicit assertion",n:"Intent: diagnostic"},
    {ty:"finding_of",s:"mass",t:"colonoscopy",c:"definite",m:"explicit assertion",n:"The mass was produced by the colonoscopy"},
    {ty:"evidence_for",s:"mass",t:"cancer",c:"probable",m:"inferred from text",n:"Direction: evidence → conclusion, the reverse of causal"},
    {ty:"evidence_for",s:"biopsy",t:"cancer",c:"definite",m:"explicit assertion",n:"Histological confirmation"},
    {ty:"evidence_for",s:"hb",t:"anaemia",c:"definite",m:"computed",n:"Value below reference range"},
    {ty:"evidence_for",s:"fatigue",t:"anaemia",c:"possible",m:"inferred from text",n:"Weak and non-specific: fatigue supports many conclusions"},
    {ty:"ruled_out_by",s:"pe",t:"ddimer",c:"definite",m:"explicit assertion",n:"Incomplete on its own: exclusion rests on low Wells score AND a negative D-dimer"},
  ],

  /* ---- Downstream tasks (pane 2) ----
   * One perfect example per capability. Each shows what SNOMED CT enables
   * that ICD-10 cannot, tied to pt_001's clinical story.
   */
  downstreamTasks: [
    {
      capability: "Cohort identification",
      icon: "🔍",
      headline: "Find trial-eligible patients across three criteria",
      trialContext: "Oncology trial — colon cancer patients with CKD (renal exclusion), no anticoagulation history",
      filters: [
        {rel:"is-a hierarchy", crit:"Neoplasm of colon", match:"Colon adenocarcinoma", stmtId:"cancer"},
        {rel:"Finding site (attribute)", crit:"Kidney structure", match:"CKD stage 3b", stmtId:"ckd"},
        {rel:"Finding context (negation)", crit:"Pulmonary embolism = refuted", match:"PE ruled out → eligible", stmtId:"pe"},
      ],
    },
    {
      capability: "Post-coordination",
      icon: "🧩",
      headline: "Unlock anti-EGFR therapy",
      therapyContext: "KRAS wild type metastatic colorectal cancer → cetuximab/panitumumab indicated. KRAS mutant → not effective.",
      expression: [
        {concept:"93761005", display:"Adenocarcinoma of sigmoid colon"},
        {attr:"Finding site", value:"60184004", valueDisplay:"Sigmoid colon structure"},
        {attr:"Associated morphology", value:"35917007", valueDisplay:"Adenocarcinoma"},
        {attr:"Stage", value:"pT3 N1a M0, IIIB"},
        {attr:"Biomarker", value:"KRAS wild type", valueDisplay:"→ anti-EGFR therapy indicated", isDecision:true},
      ],
    },
    {
      capability: "Value set expansion",
      icon: "📋",
      headline: "Catch the next penicillin before it reaches the patient",
      adrContext: "Patient got a generalized rash from Amoxicillin. Clinical Decision Support (CDS) must flag any penicillin on future prescriptions.",
      flow: [
        {step:"Patient has documented allergy", detail:"Rash from Amoxicillin (376988004)"},
        {step:"New prescription attempted", detail:"Flucloxacillin (346325008)"},
        {step:"CDS checks value set", detail:"All descendants of 373873005 |Penicillin antibacterial|"},
        {step:"Match found — alert", detail:"Flucloxacillin IS a penicillin → blocked", isAlert:true},
      ],
      expanded: [
        {code:"376988004", display:"Amoxicillin", isPatient:true},
        {code:"346325008", display:"Flucloxacillin", isAlert:true},
        {code:"327089008", display:"Phenoxymethylpenicillin"},
        {code:"352020097", display:"Piperacillin"},
        {code:"186330000", display:"Co-amoxiclav"},
      ],
    },
    {
      capability: "Research-ready data sharing (EHDS)",
      icon: "🌐",
      headline: "Share research data without sharing patient identity",
      studyContext: "Pan-European oncology study — share coded records across borders for cohort identification",
      piiRecord: {
        title: "EHR record (contains PII)",
        fields: [
          {label:"Name", value:"Birthe Hansen", isPII:true},
          {label:"DOB", value:"1956-03-15", isPII:true},
          {label:"Address", value:"Valby, Copenhagen", isPII:true},
          {label:"Note", value:"Colonoscopy showed 4cm mass in sigmoid...", isPII:true},
        ],
      },
      researchRecord: {
        title: "Research record (SNOMED CT concepts only)",
        fields: [
          {label:"Diagnosis", value:"93761005 |Adenocarcinoma of sigmoid colon|"},
          {label:"Stage", value:"pT3 N1a M0, IIIB"},
          {label:"Biomarker", value:"KRAS wild type"},
          {label:"Finding site", value:"60184004 |Sigmoid colon structure|"},
        ],
      },
      conclusion: "Same clinical meaning — no patient identity. Researchers can query by stage or biomarker across borders without seeing who the patient is.",
    },
  ],

  /* ---- What ICD-10 loses (pane 2) ----
   * For key statements, shows which clinical attributes SNOMED CT captures
   * but ICD-10 cannot represent.
   */
  icd10Loss: {
    cancer: {
      icd10: "C18.7 — Malignant neoplasm of sigmoid colon",
      lost: [
        {attr:"Morphology", snomed:"Adenocarcinoma (35917007)", lost:"ICD-10 has no morphology field — cancer type is in the code name only"},
        {attr:"Stage", snomed:"pT3 N1a M0, IIIB", lost:"Stage is not representable in ICD-10 — requires separate TNM coding system"},
        {attr:"Grade", snomed:"G2 (moderately differentiated)", lost:"Grade is not representable in ICD-10"},
        {attr:"Biomarker", snomed:"KRAS wild type", lost:"Biomarker results are not representable in ICD-10"},
      ],
    },
    ckd: {
      icd10: "N18.32 — CKD stage 3b",
      lost: [
        {attr:"Finding site", snomed:"64033007 |Kidney structure|", lost:"Implied by the code, not structured as a queryable attribute"},
      ],
    },
    rash: {
      icd10: "L27.0 — Generalized skin eruption due to drug",
      lost: [
        {attr:"Causative agent", snomed:"376988004 |Amoxicillin|", lost:"ICD-10 cannot link the reaction to the specific drug"},
        {attr:"Severity", snomed:"Moderate", lost:"Severity is not representable in ICD-10"},
        {attr:"Course", snomed:"Resolved on withdrawal", lost:"Clinical course is not representable in ICD-10"},
      ],
    },
    fathermi: {
      icd10: "Z82.49 — Family history of ischemic heart disease",
      lost: [
        {attr:"Subject", snomed:"Family member (father)", lost:"ICD-10 cannot specify which family member"},
        {attr:"Condition", snomed:"Myocardial infarction (22298006)", lost:"ICD-10 says 'heart disease' — not which specific condition"},
      ],
    },
  },

  /* ---- Downstream clinical tasks (pane 3 — FHIR-enabled) ---- */
  downstream: {
    adrAlert: {
      title: "Adverse Drug Reaction — Allergy Alert",
      what: "Detects when a drug causes a harmful reaction and warns clinicians before re-prescribing.",
      fired: true,
      severity: "probable",
      causality: "WHO-UMC probable",
      drug: {snomed:"376988004",display:"Amoxicillin (product)",rxnorm:"723"},
      reaction: {snomed:"271807003",display:"Eruption of skin",meddra:"10037480",meddraTerm:"Rash"},
      onset: "2024-03-05 (3 days after drug start)",
      abatement: "2024-03-09 (resolved on withdrawal)",
      criteria: ["Plausible temporal relationship","Other causes excluded","Resolved on withdrawal","No rechallenge"],
      action: "Document AllergyIntolerance in EHR — penicillin contraindication",
      fhirResource: "AllergyIntolerance",
    },
    cdsRule: {
      title: "CDS — Renal Dose Adjustment",
      what: "Clinical Decision Support: real-time rules that fire when a patient's coded conditions meet a safety rule.",
      fired: true,
      rule: "CKD stage 3b + new drug prescription → check renal dosing",
      trigger: "N18.32 + amoxicillin prescription",
      recommendation: "Amoxicillin dose should be adjusted for eGFR 30–44 mL/min (q12h instead of q8h). Stopped early due to ADR — review penicillin allergy.",
      severity: "moderate",
    },
    qualityMeasure: {
      title: "Quality Measure — Oncology Staging Capture",
      what: "Standardized metrics that hospitals must report — e.g. 'was cancer staging fully documented?'",
      status: "complete",
      measure: "Colon cancer: TNM staging documented",
      captured: ["Topography: sigmoid colon","Morphology: adenocarcinoma","Grade: G2","Stage: pT3 N1a M0 (IIIB)","Biomarker: KRAS wild type"],
      completeness: "100%",
    },
    phenotype: {
      title: "Research Phenotype — Colon Cancer Cohort",
      what: "Identifies patients matching research cohort criteria — precise enough for trial enrollment.",
      match: true,
      cohort: "Colon adenocarcinoma, stages II–III",
      criteria: ["SNOMED 93761005 (Colon adenocarcinoma)","Topography: 60184004 (Sigmoid colon)","Stage IIIB"],
      eligible: true,
    },
  },

  /* ---- Concept maps (pane 2b) ----
   * SNOMED CT → ICD-11, ICD-10-DK (Danish), MedDRA, LOINC, RxNorm.
   * ICD-11 codes to be verified via WHO ICD-11 API; MedDRA codes from
   * the SNOMED CT↔MedDRA bridge. Danish terms from the Danish SNOMED CT
   * translation (Sundterm project, Sundhedsdatastyrelsen) and ICD-10-DK (SKS).
   */
  maps: [
    {
      snomed: {code:"93761005",display:"Colon adenocarcinoma"},
      dk: {display:"Adenocarcinom i sigtarmen"},
      icd11: {code:"2B62.1",display:"Malignant neoplasm of sigmoid colon"},
      icd10cm: {code:"C18.7",display:"Malignant neoplasm of sigmoid colon"},
      icd10dk: {code:"C18.7",display:"Malign svulst i sigtarmen"},
      meddra: {code:"10005038",display:"Colon cancer"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"709044004",display:"Chronic kidney disease"},
      dk: {display:"Kronisk nyresygdom"},
      icd11: {code:"GB6Z0",display:"Chronic kidney disease, stage 3"},
      icd10cm: {code:"N18.32",display:"CKD stage 3b"},
      icd10dk: {code:"N18.9",display:"Kronisk nyresygdom, uspecificeret"},
      meddra: {code:"10028582",display:"Chronic kidney disease"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"271737000",display:"Anemia"},
      dk: {display:"Anæmi"},
      icd11: {code:"MA50.0",display:"Anaemia in chronic kidney disease"},
      icd10cm: {code:"D63.1",display:"Anemia in chronic kidney disease"},
      icd10dk: {code:"D63.1",display:"Anæmi ved kronisk nyresygdom"},
      meddra: {code:"10002767",display:"Anaemia"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"271807003",display:"Eruption of skin"},
      dk: {display:"Hududslæt"},
      icd11: {code:"EA00",display:"Eruption of skin"},
      icd10cm: {code:"L27.0",display:"Generalized skin eruption due to drug"},
      icd10dk: {code:"L27.0",display:"Generelle hududslæt forårsaget af lægemidler"},
      meddra: {code:"10037480",display:"Rash"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"84229001",display:"Fatigue"},
      dk: {display:"Træthed"},
      icd11: {code:"MG30",display:"Fatigue"},
      icd10cm: {code:"R53.83",display:"Other fatigue"},
      icd10dk: {code:"R53.8",display:"Anden træthed"},
      meddra: {code:"10015931",display:"Fatigue"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"405729008",display:"Hematochezia"},
      dk: {display:"Hæmatochezi"},
      icd11: {code:"DA58",display:"Haematochezia"},
      icd10cm: {code:"K62.5",display:"Hemorrhage of rectum"},
      icd10dk: {code:"K62.5",display:"Blødning fra rectum"},
      meddra: {code:"10053593",display:"Haematochezia"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"312342009",display:"Upper respiratory infection"},
      dk: {display:"Øvre luftvejsinfektion"},
      icd11: {code:"CA40",display:"Acute upper respiratory infection"},
      icd10cm: {code:"J06.9",display:"Acute upper respiratory infection, unspecified"},
      icd10dk: {code:"J06.9",display:"Akut infektion i de øvre luftveje, uspecificeret"},
      meddra: {code:"10045715",display:"Upper respiratory tract infection"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"22298006",display:"Myocardial infarction"},
      dk: {display:"Myokardieinfarkt"},
      icd11: {code:"BA41",display:"Myocardial infarction"},
      icd10cm: {code:"Z82.49",display:"Family history of ischemic heart disease"},
      icd10dk: {code:"Z82.4",display:"Arvelig disposition for iskæmisk hjertesygdom"},
      meddra: {code:"10031681",display:"Myocardial infarction"},
      loinc: null,
      rxnorm: null,
    },
    {
      snomed: {code:"59282003",display:"Pulmonary embolism (ruled out)"},
      dk: {display:"Lungeemboli"},
      icd11: {code:"BD70",display:"Pulmonary embolism"},
      icd10cm: null,
      icd10dk: null,
      meddra: {code:"10034256",display:"Pulmonary embolism"},
      loinc: null,
      rxnorm: null,
      note: "Ruled out — no ICD-10 code assigned (guideline §I.B.9)",
    },
    {
      snomed: {code:"119297000",display:"Blood hemoglobin level"},
      dk: {display:"Hæmoglobin"},
      icd11: null,
      icd10cm: null,
      icd10dk: null,
      meddra: null,
      loinc: {code:"718-7",display:"Hemoglobin [Mass/volume] in Blood"},
      rxnorm: null,
    },
    {
      snomed: {code:"714648002",display:"D-dimer antigen"},
      dk: {display:"D-dimer"},
      icd11: null,
      icd10cm: null,
      icd10dk: null,
      meddra: null,
      loinc: {code:"48065-7",display:"D-dimer"},
      rxnorm: null,
    },
    {
      snomed: {code:"376988004",display:"Amoxicillin (product)"},
      dk: {display:"Amoxicillin"},
      icd11: {code:"XA9PT5",display:"Amoxicillin"},
      icd10cm: null,
      icd10dk: null,
      meddra: {code:"10003358",display:"Amoxicillin"},
      loinc: null,
      rxnorm: {code:"723",display:"Amoxicillin"},
    },
    {
      snomed: {code:"73761001",display:"Colonoscopy"},
      dk: {display:"Koloskopi"},
      icd11: {code:"2D01.4",display:"Colonoscopy"},
      icd10cm: null,
      icd10dk: null,
      meddra: {code:"10056940",display:"Colonoscopy"},
      loinc: {code:"29550-1",display:"Colonoscopy"},
      rxnorm: null,
    },
  ],

  /* ---- FHIR Bundle (pane 3) ----
   * Built from the SNOMED statements. Each statement maps to a FHIR resource.
   * Resource types: Condition, AllergyIntolerance, FamilyMemberHistory,
   * Procedure, Observation.
   */
  fhirBundle: {
    resourceType: "Bundle",
    type: "transaction",
    meta: {
      lastUpdated: "2024-06-15T10:30:00Z",
      profile: ["http://hl7.org/fhir/uv/ips/StructureDefinition/Bundle-ips"],
    },
    entry: [
      // — Patient —
      {
        fullUrl: "urn:uuid:pt-001",
        resource: {
          resourceType: "Patient",
          id: "pt-001",
          name: [{family: "Sørensen", given: ["Margrete"]}],
          gender: "female",
          birthDate: "1956-01-01",
        },
        request: {method: "POST", url: "Patient"},
      },
      // — Colon adenocarcinoma (Condition) —
      {
        fullUrl: "urn:uuid:cond-cancer",
        resource: {
          resourceType: "Condition",
          id: "cond-cancer",
          subject: {reference: "urn:uuid:pt-001"},
          code: {coding: [{system: "http://snomed.info/sct", code: "93761005", display: "Colon adenocarcinoma"}]},
          clinicalStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active"}]},
          verificationStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed"}]},
          onsetDateTime: "2024-06-14",
          bodySite: [{coding: [{system: "http://snomed.info/sct", code: "60184004", display: "Sigmoid colon structure"}]}],
          stage: [{summary: {coding: [{system: "http://snomed.info/sct", code: "258219007", display: "Stage IIIB"}]}}],
          note: [{text: "AJCC 8th edition: pT3 N1a M0. Grade G2. KRAS wild type. Morphology: adenocarcinoma (ICD-O-3 8140/3)."}],
        },
        request: {method: "POST", url: "Condition"},
      },
      // — CKD (Condition) —
      {
        fullUrl: "urn:uuid:cond-ckd",
        resource: {
          resourceType: "Condition",
          id: "cond-ckd",
          subject: {reference: "urn:uuid:pt-001"},
          code: {coding: [{system: "http://snomed.info/sct", code: "709044004", display: "Chronic kidney disease"}]},
          clinicalStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active"}]},
          verificationStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed"}]},
          onsetDateTime: "2019-01-01",
          bodySite: [{coding: [{system: "http://snomed.info/sct", code: "64033007", display: "Kidney structure"}]}],
          stage: [{summary: {coding: [{display: "CKD stage 3b"}]}}],
        },
        request: {method: "POST", url: "Condition"},
      },
      // — Anemia (Condition) —
      {
        fullUrl: "urn:uuid:cond-anaemia",
        resource: {
          resourceType: "Condition",
          id: "cond-anaemia",
          subject: {reference: "urn:uuid:pt-001"},
          code: {coding: [{system: "http://snomed.info/sct", code: "271737000", display: "Anemia"}]},
          clinicalStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active"}]},
          verificationStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/condition-ver-status", code: "confirmed"}]},
          onsetDateTime: "2021-04-01",
          severity: {coding: [{system: "http://snomed.info/sct", code: "6736007", display: "Moderate"}]},
        },
        request: {method: "POST", url: "Condition"},
      },
      // — AllergyIntolerance (amoxicillin → rash) —
      {
        fullUrl: "urn:uuid:allergy-amox",
        resource: {
          resourceType: "AllergyIntolerance",
          id: "allergy-amox",
          patient: {reference: "urn:uuid:pt-001"},
          code: {coding: [{system: "http://snomed.info/sct", code: "376988004", display: "Amoxicillin (product)"}]},
          clinicalStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", code: "active"}]},
          verificationStatus: {coding: [{system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", code: "confirmed"}]},
          type: "allergy",
          category: ["medication"],
          criticality: "low",
          reaction: [{
            manifestation: [{coding: [{system: "http://snomed.info/sct", code: "271807003", display: "Eruption of skin"}]}],
            onset: "2024-03-05",
            abatement: "2024-03-09",
            severity: "moderate",
          }],
          note: [{text: "WHO-UMC causality: probable. Onset 3 days after drug start. Resolved on withdrawal."}],
        },
        request: {method: "POST", url: "AllergyIntolerance"},
      },
      // — FamilyMemberHistory (father MI) —
      {
        fullUrl: "urn:uuid:fhx-mi",
        resource: {
          resourceType: "FamilyMemberHistory",
          id: "fhx-mi",
          patient: {reference: "urn:uuid:pt-001"},
          relationship: {coding: [{system: "http://snomed.info/sct", code: "66839005", display: "Father"}]},
          condition: [{code: {coding: [{system: "http://snomed.info/sct", code: "22298006", display: "Myocardial infarction"}]}}],
          status: "completed",
        },
        request: {method: "POST", url: "FamilyMemberHistory"},
      },
      // — Procedure: Colonoscopy —
      {
        fullUrl: "urn:uuid:proc-colonoscopy",
        resource: {
          resourceType: "Procedure",
          id: "proc-colonoscopy",
          subject: {reference: "urn:uuid:pt-001"},
          status: "completed",
          code: {coding: [{system: "http://snomed.info/sct", code: "73761001", display: "Colonoscopy"}]},
          performedDateTime: "2024-06-10",
          bodySite: [{coding: [{system: "http://snomed.info/sct", code: "71854001", display: "Colon structure"}]}],
        },
        request: {method: "POST", url: "Procedure"},
      },
      // — Procedure: Biopsy —
      {
        fullUrl: "urn:uuid:proc-biopsy",
        resource: {
          resourceType: "Procedure",
          id: "proc-biopsy",
          subject: {reference: "urn:uuid:pt-001"},
          status: "completed",
          code: {coding: [{system: "http://snomed.info/sct", code: "86273004", display: "Biopsy of sigmoid colon"}]},
          performedDateTime: "2024-06-10",
          bodySite: [{coding: [{system: "http://snomed.info/sct", code: "60184004", display: "Sigmoid colon structure"}]}],
        },
        request: {method: "POST", url: "Procedure"},
      },
      // — Observation: Hb —
      {
        fullUrl: "urn:uuid:obs-hb",
        resource: {
          resourceType: "Observation",
          id: "obs-hb",
          subject: {reference: "urn:uuid:pt-001"},
          status: "final",
          code: {coding: [
            {system: "http://loinc.org", code: "718-7", display: "Hemoglobin [Mass/volume] in Blood"},
            {system: "http://snomed.info/sct", code: "119297000", display: "Blood hemoglobin level"}
          ]},
          effectiveDateTime: "2021-04-11",
          valueQuantity: {value: 9.1, unit: "g/dL", system: "http://unitsofmeasure.org", code: "g/dL"},
          referenceRange: [{low: {value: 12.0, unit: "g/dL"}, high: {value: 16.0, unit: "g/dL"}, type: {text: "normal range"}}],
          interpretation: [{coding: [{system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "L", display: "Low"}]}],
        },
        request: {method: "POST", url: "Observation"},
      },
      // — Observation: D-dimer —
      {
        fullUrl: "urn:uuid:obs-ddimer",
        resource: {
          resourceType: "Observation",
          id: "obs-ddimer",
          subject: {reference: "urn:uuid:pt-001"},
          status: "final",
          code: {coding: [
            {system: "http://loinc.org", code: "48065-7", display: "D-dimer"},
            {system: "http://snomed.info/sct", code: "714648002", display: "D-dimer antigen"}
          ]},
          effectiveDateTime: "2024-06-10",
          valueQuantity: {value: 0.21, unit: "µg/mL FEU", system: "http://unitsofmeasure.org", code: "ug/mL"},
          referenceRange: [{high: {value: 0.5, unit: "µg/mL FEU"}, type: {text: "normal range"}}],
          interpretation: [{coding: [{system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: "N", display: "Normal"}]}],
        },
        request: {method: "POST", url: "Observation"},
      },
    ],
  },

  /* ---- Timeline visual config (pane 4 — port of patient_graph_explorer_5) ---- */
  timeline: {
    KIND: {
      disease:{c:"#6C63C7",dk:"#9C95E8",l:"Diseases"},
      phenotype:{c:"#B0487A",dk:"#E693B6",l:"Phenotypes"},
      cancer:{c:"#C0532C",dk:"#E08A62",l:"Cancer"},
      procedure:{c:"#1B8F6A",dk:"#4FC49B",l:"Procedures"},
      medication:{c:"#2E6FB5",dk:"#6BA5E0",l:"Medications"},
      lab:{c:"#7A7973",dk:"#A9A8A1",l:"Labs"},
    },
    FAM: {
      causal:{c:"#9B2C2C",dk:"#E28080",dash:"",l:"Causal"},
      temporal:{c:"#8A5A11",dk:"#D2A24C",dash:"5 4",l:"Temporal"},
      intentional:{c:"#4A7A18",dk:"#93C25A",dash:"",l:"Intentional"},
      evidential:{c:"#2E5C8A",dk:"#7FB0E0",dash:"2 3",l:"Evidential"},
    },
    DISP: {
      due_to:{v:"causes",flip:1},
      causative_agent:{v:"causes",flip:1},
      associated_with:{v:"associated with",flip:0},
      after:{v:"then",flip:1},
      before:{v:"then",flip:0},
      during:{v:"during",flip:0},
      has_focus:{v:"targets",flip:0},
      indication_for:{v:"given for",flip:0},
      contraindication_for:{v:"contraindicated by",flip:0},
      evidence_for:{v:"supports",flip:0},
      evidence_against:{v:"contradicts",flip:0},
      ruled_out_by:{v:"rules out",flip:1},
      finding_of:{v:"found",flip:1},
      interprets:{v:"interprets",flip:0},
    },
    LT: {
      due_to:"causal",causative_agent:"causal",associated_with:"causal",
      after:"temporal",before:"temporal",during:"temporal",
      has_focus:"intentional",indication_for:"intentional",
      evidence_for:"evidential",finding_of:"evidential",ruled_out_by:"evidential",interprets:"evidential",
    },
  },
};
