export const demo_codebook = {
  settings: {
    can_edit_codes: true,
  },
  codes: [
    { code: "VVD", parent: "Actor", active: true },
    { code: "D66", parent: "Actor", active: true },
    { code: "Groenlinks", parent: "Actor", active: true },
    { code: "Mark Rutte", parent: "VVD", active: true },
    { code: "Sigrid Kaag", parent: "D66", active: true },
    { code: "Jesse Klaver", parent: "Groenlinks", active: true },
    { code: "Climate change", parent: "Issue", active: true },
  ],
  relations: [],

  code_annotations: {
    coding_unit: "code", // code, relation
    context_unit: {
      paragraph_window: [0, 0],
      sentence_window: [1, 1],
      word_window: [20, 20],
    },
    sampling: {
      max_per_document: null,
      random_documents: true,
      random_order: true,
    },

    tasks: [
      {
        header: "Issue identification",
        codes_parent: "Issue",
        instruction: 'Does "[text]" refer to the issue "[code]"?',
        options: ["yes", "no"],
      },
    ],
  },

  relation_annotations: {},
};

export const demo_articles = [
  {
    document_id: "Some document ID",
    annotations: [],
    text_fields: [
      {
        name: "title",
        value: `GL en PvdA hebben goed gesprek met informateur, maar wantrouwen Rutte`,
      },
      {
        name: "text",
        value: `PvdA-leider Lilianne Ploumen en GroenLinks-leider Jesse Klaver hadden vrijdag een goed gesprek met informateur Herman Tjeenk Willink, zeiden ze zelf. De twee benadrukten dat, hoewel er inhoudelijke stappen zijn gezet, hun vertrouwen in VVD-leider Mark Rutte nog niet is hersteld.

    Informateur Willink zette zich vrijdag aan zijn taak. Eerste punt op de agenda zijn gesprekken met de lijsttrekkers van de acht grootste partijen.
    
    Een week nadat een groot deel van de partijleiders bekendmaakte niet meer met Rutte verder te willen onderhandelen over een nieuwe coalitie, wordt gekeken waarover partijen het inhoudelijk eens zijn.
    
    "Het was een prettig gesprek langs de lijnen van de inhoud", zei PvdA-leider Lilianne Ploumen na afloop. Ze heeft haar zorgen over de ongelijkheid in Nederland en over de zorg gedeeld.
    
    Ook Jesse Klaver (GroenLinks), die een uur eerder op gesprek kwam bij de informateur, benadrukte dat het ging over de problemen die opgelost moeten worden.
    
    Situatie niet veranderd in een week

Wat betreft de positie ten opzichte van Rutte is echter niets veranderd. Vorige week ondertekenden Ploumen en Klaver net als alle andere oppositiepartijen een motie van wantrouwen, vanwege Ruttes betrokkenheid bij de notitie over CDA-Kamerlid Pieter Omtzigt.

"Als het aan ons ligt, was Rutte geen premier meer", zei Ploumen. Hoe Tjeenk Willink dat gedeukte vertrouwen kan herstellen, weet ze niet. "We wachten de voorstellen van de informateur af."

"De vertrouwensbreuk is niet hersteld na één gesprek met de fractievoorzitters", zei ook Klaver. "Mijn mening over Rutte is niet veranderd."

SP'er Lilian Marijnissen sprak zich al eerder expliciet uit tegen samenwerking met Rutte.

De partijleiders hekelen het gebrek aan openheid en transparantie waar Rutte in hun ogen voor staat. "Als je een fout maakt, dan moet je dat toegeven en er niet over liegen", zei Klaver. Ploumen: "Het probleem is dat Mark Rutte heeft gelogen. Wij hebben het vertrouwen in hem opgezegd."

Wat de vervolgstappen moeten zijn, laten ze volledig over aan Tjeenk Willink. "Ik ga geen lijstjes maken met wat er moet gebeuren", zei Ploumen.

De informateur ontvangt later op vrijdag nog de partijleiders Wopke Hoekstra (CDA) en Sigrid Kaag (D66), en Rutte zelf.

Tjeenk Willink denkt niet dat Rutte zomaar door kan

Tjeenk Willink suggereerde woensdag op een persconferentie dat hij Rutte niet per se een sta-in-de-weg voor een verandering van de bestuursstijl in Den Haag vindt. Toen daarover vervolgens berichten in de media verschenen, voelde de informateur zich vrijdag genoodzaakt die boodschap bij te sturen.

De conclusie dat Rutte geen belemmering vormt voor de formatie, kan hij niet voor zijn rekening nemen, luidt een schriftelijke verklaring.

Tjeenk Willink heeft namelijk ook de opdracht om te onderzoeken "of en zo ja onder welke voorwaarden er voldoende vertrouwen tussen partijen bestaat of weer kan ontstaan".`,
      },
    ],
  },
  {
    document_id: "Another document ID",
    annotations: [],
    text_fields: [
      {
        name: "title",
        value: `CU-leider Segers vindt dat uitspraak over Rutte te veel op de man was gespeeld`,
      },
      {
        name: "text",
        value: `Partijleider Gert-Jan Segers van de ChristenUnie (CU) vindt dat hij te veel op de man heeft gespeeld door coalitiedeelname uit te sluiten als VVD-leider Mark Rutte opnieuw premier zou worden. Terugblikkend zegt hij dat het niet om één persoon moet gaan, maar om "een ongezonde politieke cultuur en een genadeloze overheid". Daar moet volgens hem verandering in komen, zo zei hij zaterdag tijdens een congres van de partij.

    
    Segers deed zijn uitspraak over Rutte na het debat over de notitie "functie elders" voor CDA-Kamerlid Pieter Omtzigt. Binnen de CU is verdeeldheid ontstaan over het besluit van de fractie, erkent Segers.
    
    Naast steun is er ook kritiek van veel leden, die zeggen dat hij "te veel op de man heeft gespeeld en te weinig de bal". "Te veel Rutte, te weinig ons allemaal. En als dat de perceptie van veel mensen is, dan moet ik me dat aantrekken", aldus Segers tijdens het congres.
    
    
    Volgens de CU-leider staat "de politieke cultuur in Den Haag natuurlijk niet los van Mark Rutte, zeker niet".
    
    "Maar die oude cultuur staat of valt niet met één man. Ook wijzelf maken er deel van uit. Ik wil niet genadeloos zijn voor personen, maar ik wil wel hard en helder zijn over een cultuur die niet deugt en een genadeloze overheid. Daar moet écht een omslag in komen", zei Segers.
    
    
    De ChristenUnie heeft vijf zetels in de Tweede Kamer. Op het congres werden vier oude Kamerleden uitgezwaaid en trad Ankie van Tatenhove aan als nieuwe partijvoorzitter.`,
      },
    ],
  },
];
