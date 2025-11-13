import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if SmartPhrase table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'SmartPhrase'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('SmartPhrase table does not exist, creating...');

      // Read and execute the migration SQL
      const migrationPath = path.join(__dirname, 'migrations', '20251113000000_add_smartphrase_model', 'migration.sql');

      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        await client.query(migrationSQL);
        console.log('SmartPhrase table created successfully');
      } else {
        console.warn('Migration file not found, assuming table will be created by Prisma migrations');
      }
    } else {
      console.log('SmartPhrase table already exists');
    }

    // Check if we already have seed data
    const countResult = await client.query('SELECT COUNT(*) FROM "SmartPhrase"');
    const count = parseInt(countResult.rows[0].count);

    if (count > 0) {
      console.log(`SmartPhrase table already has ${count} records, skipping seed`);
      return;
    }

    console.log('Seeding SmartPhrase data...');

    // Seed data - Common EPIC SmartPhrases
    const smartPhrases = [
      {
        slug: '.HPI_CHESTPAIN',
        title: 'HPI - Chest Pain',
        category: 'HPI',
        description: 'Standard chest pain history template',
        content: `Patient presents with chest pain. Pain is described as [sharp/dull/crushing/pressure-like]. Location: [substernal/left-sided/right-sided]. Onset: [sudden/gradual] approximately [X] hours/days ago. Duration: [constant/intermittent], lasting [X] minutes when present. Radiation: [to left arm/jaw/back/none]. Associated symptoms: [shortness of breath/diaphoresis/nausea/palpitations/none]. Exacerbating factors: [exertion/deep breathing/position change/none]. Relieving factors: [rest/nitroglycerin/position change/none]. Similar episodes in past: [yes/no].`,
        tags: ['chest pain', 'cardiac', 'emergency']
      },
      {
        slug: '.HPI_SOB',
        title: 'HPI - Shortness of Breath',
        category: 'HPI',
        description: 'Dyspnea assessment template',
        content: `Patient presents with shortness of breath. Onset: [sudden/gradual] approximately [X] hours/days ago. Severity: [mild/moderate/severe]. At rest vs with exertion: [at rest/with minimal exertion/with moderate exertion]. Orthopnea: [yes/no], sleeps on [X] pillows. PND: [yes/no]. Associated symptoms: [chest pain/cough/fever/leg swelling/wheezing]. Recent illness: [yes/no]. Similar episodes: [yes/no]. Current respiratory status: speaking in [full sentences/short phrases/single words].`,
        tags: ['dyspnea', 'respiratory', 'emergency']
      },
      {
        slug: '.PEABD',
        title: 'Physical Exam - Abdomen',
        category: 'Physical Exam',
        description: 'Abdominal examination findings',
        content: `ABDOMEN: Soft, [non-tender/tender to palpation in RUQ/LUQ/RLQ/LLQ]. No rebound or guarding. Bowel sounds [normal/hyperactive/hypoactive/absent]. No masses palpable. No hepatosplenomegaly. [No/+] CVA tenderness. [No/+] Murphy's sign. [No/+] McBurney's point tenderness.`,
        tags: ['abdomen', 'physical exam', 'GI']
      },
      {
        slug: '.PECARDIO',
        title: 'Physical Exam - Cardiovascular',
        category: 'Physical Exam',
        description: 'Cardiovascular examination findings',
        content: `CARDIOVASCULAR: Regular rate and rhythm. [No/S3/S4] gallop. [No murmurs/systolic murmur/diastolic murmur]. Peripheral pulses 2+ and equal bilaterally. No peripheral edema. Capillary refill <2 seconds. JVP [not elevated/elevated to X cm]. No carotid bruits.`,
        tags: ['cardiovascular', 'heart', 'physical exam']
      },
      {
        slug: '.PERESP',
        title: 'Physical Exam - Respiratory',
        category: 'Physical Exam',
        description: 'Respiratory examination findings',
        content: `RESPIRATORY: Breathing comfortably on [room air/X L NC/X L NRB/BiPAP/ventilator]. Lungs clear to auscultation bilaterally. [No/+] wheezes. [No/+] rales. [No/+] rhonchi. Respirations non-labored. No accessory muscle use. No retractions.`,
        tags: ['respiratory', 'lungs', 'physical exam']
      },
      {
        slug: '.PENEURO',
        title: 'Physical Exam - Neurological',
        category: 'Physical Exam',
        description: 'Neurological examination findings',
        content: `NEUROLOGICAL: Alert and oriented x3. CN II-XII grossly intact. Motor strength 5/5 in all extremities. Sensation intact to light touch. DTRs 2+ and symmetric. Gait steady. [No/+] pronator drift. Cerebellar function intact with finger-to-nose and heel-to-shin testing. No focal deficits.`,
        tags: ['neurological', 'neuro', 'physical exam']
      },
      {
        slug: '.PEGENERAL',
        title: 'Physical Exam - General',
        category: 'Physical Exam',
        description: 'General appearance assessment',
        content: `GENERAL: [Well-appearing/ill-appearing/toxic-appearing] [age]-year-old [male/female] in [no acute distress/mild distress/moderate distress/severe distress]. [Alert and oriented/confused/lethargic]. Appropriate affect. Good eye contact. Cooperative with examination.`,
        tags: ['general', 'appearance', 'physical exam']
      },
      {
        slug: '.MDM_CHEST_PAIN',
        title: 'MDM - Chest Pain Assessment',
        category: 'MDM',
        description: 'Medical decision making for chest pain',
        content: `Patient presents with chest pain concerning for [ACS/PE/aortic dissection/musculoskeletal pain/GERD]. Differential diagnosis includes acute coronary syndrome, pulmonary embolism, aortic dissection, pericarditis, pneumonia, pneumothorax, musculoskeletal pain, and gastroesophageal reflux. Risk factors include [age/diabetes/hypertension/hyperlipidemia/smoking/family history]. ECG shows [normal sinus rhythm/ST elevations/ST depressions/T wave inversions/no acute changes]. Troponin [negative/elevated/pending]. HEART score: [X]. Plan includes [serial troponins/cardiology consult/CT angiography/stress test/medical management/admission/discharge with close follow-up].`,
        tags: ['mdm', 'chest pain', 'cardiac']
      },
      {
        slug: '.MDM_SEPSIS',
        title: 'MDM - Sepsis Management',
        category: 'MDM',
        description: 'Sepsis assessment and management',
        content: `Patient meets [SIRS/qSOFA/sepsis/severe sepsis/septic shock] criteria. Source likely [respiratory/urinary/intra-abdominal/skin and soft tissue/unknown]. Lactate: [X]. WBC: [X]. Hemodynamically [stable/unstable] with MAP [X]. Initiated sepsis bundle including: blood cultures drawn prior to antibiotics, broad-spectrum antibiotics ([specify]), 30 mL/kg fluid resuscitation, lactate clearance protocol. [Vasopressors initiated/not required]. Source control addressed via [imaging/surgical consult/drainage]. ICU consultation obtained. Continue close monitoring and reassessment.`,
        tags: ['mdm', 'sepsis', 'critical care']
      },
      {
        slug: '.DISPO_DISCHARGE',
        title: 'Disposition - Discharge',
        category: 'Disposition',
        description: 'Discharge instructions template',
        content: `Patient stable for discharge home. Discharge instructions reviewed including warning signs to return to ED: [worsening symptoms/fever/chest pain/difficulty breathing/etc]. Prescriptions provided for [medications]. Patient advised to follow up with [PCP/specialist] in [X] days/weeks. Patient verbalizes understanding and agrees with plan. All questions answered.`,
        tags: ['disposition', 'discharge']
      },
      {
        slug: '.DISPO_ADMIT',
        title: 'Disposition - Admission',
        category: 'Disposition',
        description: 'Admission template',
        content: `Patient requires admission for [diagnosis/further management/observation]. Admitting service: [medicine/surgery/cardiology/etc]. Admission orders placed. Patient and family notified of plan. Accepting physician: Dr. [Name] contacted and agrees with admission. Bed request placed. Patient currently [stable/unstable] awaiting bed assignment.`,
        tags: ['disposition', 'admission']
      },
      {
        slug: '.PROC_IV',
        title: 'Procedure - IV Placement',
        category: 'Procedures',
        description: 'IV placement procedure note',
        content: `PROCEDURE: Peripheral IV placement. INDICATION: [IV access for medications/fluids/labs]. CONSENT: Verbal consent obtained. SITE: [Right/Left] [hand/forearm/antecubital fossa]. EQUIPMENT: [18/20/22] gauge IV catheter. TECHNIQUE: Standard sterile technique. Site prepped with alcohol. Tourniquet applied. Successful venipuncture on [first/second/third] attempt. Flash noted. IV catheter advanced. Tourniquet removed. IV flushed without resistance or infiltration. Secured with transparent dressing. COMPLICATIONS: None. Patient tolerated well.`,
        tags: ['procedure', 'iv', 'access']
      },
      {
        slug: '.PROC_LP',
        title: 'Procedure - Lumbar Puncture',
        category: 'Procedures',
        description: 'Lumbar puncture procedure note',
        content: `PROCEDURE: Lumbar puncture. INDICATION: [Rule out meningitis/SAH/IIH]. CONSENT: Written informed consent obtained after discussion of risks including bleeding, infection, headache, nerve injury. POSITION: [Lateral decubitus/sitting]. SITE: L[3-4/4-5] interspace identified by palpation of iliac crest. TECHNIQUE: Sterile prep with chlorhexidine. Sterile drape applied. 1% lidocaine local anesthesia. [20/22] gauge spinal needle inserted with bevel parallel to spine fibers. CSF obtained at [X] cm depth. Opening pressure: [X] cm H2O. SPECIMENS: Tube 1-4 sent for [cell count, glucose, protein, gram stain, culture]. Closing pressure: [X] cm H2O. Needle removed. Sterile dressing applied. COMPLICATIONS: None. Patient tolerated procedure well. Post-procedure instructions given including bed rest and hydration.`,
        tags: ['procedure', 'lumbar puncture', 'CSF']
      },
      {
        slug: '.PROC_LACERATION',
        title: 'Procedure - Laceration Repair',
        category: 'Procedures',
        description: 'Laceration repair procedure note',
        content: `PROCEDURE: Laceration repair. WOUND: [X] cm [linear/stellate/irregular] laceration to [location]. EXAMINATION: Neurovascular exam distal to wound intact. Motor and sensory function preserved. No tendon involvement. No foreign body visible or palpable. CONSENT: Risks and benefits discussed including bleeding, infection, scarring, need for future revision. Verbal consent obtained. ANESTHESIA: Local anesthesia with [X] mL of 1% lidocaine with epinephrine. IRRIGATION: Copious irrigation with normal saline. TECHNIQUE: [Simple interrupted/running/vertical mattress] sutures with [4-0/5-0/6-0] [nylon/vicryl]. Hemostasis achieved. Bacitracin ointment applied. Sterile dressing placed. SUTURE REMOVAL: [X] days. WOUND CARE: Keep clean and dry. May shower after 24 hours. Watch for signs of infection. COMPLICATIONS: None.`,
        tags: ['procedure', 'laceration', 'suture']
      },
      {
        slug: '.ROS_NEGATIVE',
        title: 'Review of Systems - All Negative',
        category: 'ROS',
        description: '10-point negative review of systems',
        content: `REVIEW OF SYSTEMS: All other systems reviewed and negative including: CONSTITUTIONAL: No fever, chills, or weight loss. EYES: No vision changes. ENT: No sore throat or hearing loss. CARDIOVASCULAR: No chest pain or palpitations. RESPIRATORY: No shortness of breath or cough. GI: No nausea, vomiting, or diarrhea. GU: No dysuria or hematuria. MUSCULOSKELETAL: No joint pain or swelling. SKIN: No rashes. NEUROLOGICAL: No headache, dizziness, or weakness. PSYCHIATRIC: No depression or anxiety. HEMATOLOGIC: No easy bruising or bleeding.`,
        tags: ['ros', 'review of systems', 'negative']
      },
      {
        slug: '.CRITICAL_CARE',
        title: 'Critical Care Time Documentation',
        category: 'Billing',
        description: 'Critical care time documentation',
        content: `Critical care time provided: [X] minutes (not including separately billable procedures). Time spent exclusively managing critically ill patient including: bedside evaluation, interpretation of diagnostic studies, discussion with other healthcare professionals, family discussion regarding treatment decisions, and documentation. Patient has high probability of imminent or life-threatening deterioration requiring frequent reassessment and intervention.`,
        tags: ['critical care', 'billing', 'time']
      }
    ];

    // Insert seed data
    for (const phrase of smartPhrases) {
      await client.query(
        `INSERT INTO "SmartPhrase" (id, slug, title, category, description, content, tags, "usageCount", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          `sp_${phrase.slug.replace(/\./g, '_')}`,
          phrase.slug,
          phrase.title,
          phrase.category,
          phrase.description,
          phrase.content,
          phrase.tags,
          0
        ]
      );
    }

    console.log(`Successfully seeded ${smartPhrases.length} SmartPhrases`);
  } catch (error) {
    console.error('Error during seed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

main()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
