const CALENDARI_DATA = {
  meta: {
    zona: "Valls (Alt Camp)",
    unitat_temporal: "quinzenes",
    codi_quinzenes: ["G1","G2","F1","F2","Mç1","Mç2","A1","A2","Mg1","Mg2","Jn1","Jn2","Jl1","Jl2","Ag1","Ag2","S1","S2","O1","O2","N1","N2","D1","D2"],
    llegenda_tags: {
      P: "Possible amb protecció (túnel/manta/hivernacle)",
      SF: "Molt sensible al fred",
      OM: "Ombra parcial recomanable amb calor",
      RG: "Reg exigent / estrès hídric crític",
      VN: "Millor arrecerit del vent (planter jove)"
    },
    mesos: ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"]
  },
  families: [
    { id: "solanacies", nom: "Solanàcies", ordre: 1 },
    { id: "cucurbitacies", nom: "Cucurbitàcies", ordre: 2 },
    { id: "lleguminoses", nom: "Lleguminoses", ordre: 3 },
    { id: "fulla", nom: "Fulla", ordre: 4 },
    { id: "brassicacies", nom: "Brassicàcies", ordre: 5 },
    { id: "arrels", nom: "Arrels", ordre: 6 },
    { id: "bulbs_tiges", nom: "Bulbs i tiges", ordre: 7 },
    { id: "altres", nom: "Altres", ordre: 8 },
    { id: "aromatiques", nom: "Aromàtiques", ordre: 9 },
    { id: "calcot", nom: "Calçot", ordre: 10 }
  ],
  crops: [
    {id:"tomaquet", nom:"Tomàquet", familia:"solanacies", categoria:"fruit", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","Mç2"]], sembra_exterior:[], trasplantament:[["A2","Mg2"]], collita:[["Jn2","O2"]]}, tags:["SF","RG","VN","P"], notes:"A1 possible amb protecció. Tutoratge, mulch i reg regular.", proteccio_recomanada:true, ordre:1},
    {id:"pebrot", nom:"Pebrot", familia:"solanacies", categoria:"fruit", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","Mç2"]], sembra_exterior:[], trasplantament:[["Mg1","Mg2"]], collita:[["Jl1","O2"]]}, tags:["SF","RG","VN","P"], notes:"A2 possible amb protecció i microclima arrecerat. Molt sensible al fred.", proteccio_recomanada:true, ordre:2},
    {id:"alberginia", nom:"Albergínia", familia:"solanacies", categoria:"fruit", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","Mç2"]], sembra_exterior:[], trasplantament:[["Mg1","Jn1"]], collita:[["Jl1","O2"]]}, tags:["SF","RG","VN","P"], notes:"A2 possible amb protecció. Necessita calor sostinguda.", proteccio_recomanada:true, ordre:3},
    {id:"tomaquet_penjar", nom:"Tomàquet de penjar", familia:"solanacies", categoria:"fruit", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","Mç2"]], sembra_exterior:[], trasplantament:[["A2","Mg2"]], collita:[["Jl1","O2"]]}, tags:["SF","RG","VN","P"], notes:"Calendari similar al tomàquet. Collita orientada a conservació.", proteccio_recomanada:true, ordre:4},

    {id:"carbasso", nom:"Carbassó", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["Mç2","A2"]], sembra_exterior:[["A2","Jn1"]], trasplantament:[["A2","Jn1"]], collita:[["Jn2","S2"]]}, tags:["SF","RG","P"], notes:"A1 possible amb protecció. Vigilar oïdi i collir sovint.", proteccio_recomanada:true, ordre:5},
    {id:"cogombre", nom:"Cogombre", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["A1","A2"]], sembra_exterior:[["Mg1","Jn1"]], trasplantament:[["Mg1","Jn1"]], collita:[["Jn2","S2"]]}, tags:["SF","RG"], notes:"Tutoratge si és enfiladís. Sensible al fred.", proteccio_recomanada:false, ordre:6},
    {id:"melo", nom:"Meló", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["A1","A2"]], sembra_exterior:[["Mg1","Mg2"]], trasplantament:[["Mg1","Mg2"]], collita:[["Jl2","S2"]]}, tags:["SF","RG"], notes:"Reg controlat; reduir al final per afavorir la dolçor.", proteccio_recomanada:false, ordre:7},
    {id:"sindria", nom:"Síndria", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["A1","A2"]], sembra_exterior:[["Mg1","Mg2"]], trasplantament:[["Mg1","Mg2"]], collita:[["Ag1","S2"]]}, tags:["SF","RG"], notes:"Molt termòfila; necessita sòl drenat.", proteccio_recomanada:false, ordre:8},
    {id:"carbassa", nom:"Carbassa", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["A1","A2"]], sembra_exterior:[["Mg1","Jn1"]], trasplantament:[["Mg1","Jn1"]], collita:[["S2","N2"]]}, tags:["SF","RG"], notes:"Necessita molt espai; collir amb pell dura.", proteccio_recomanada:false, ordre:9},
    {id:"carbasso_hivern", nom:"Carbassó d'hivern", familia:"cucurbitacies", categoria:"fruit", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["A1","A2"]], sembra_exterior:[["Mg1","Jn1"]], trasplantament:[["Mg1","Jn1"]], collita:[["S2","N2"]]}, tags:["SF","RG"], notes:"Varietats de guarda; calendari similar a carbassa.", proteccio_recomanada:false, ordre:10},

    {id:"mongeta_tendra", nom:"Mongeta tendra", familia:"lleguminoses", categoria:"llegum", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["A2","Jl2"]], trasplantament:[["Mg1","Jn1"]], collita:[["Jn2","O1"]]}, tags:["SF"], notes:"Escalonar sembres cada 2–3 setmanes. Germina amb sòl calent.", proteccio_recomanada:false, ordre:11},
    {id:"mongeta_seca", nom:"Mongeta seca", familia:"lleguminoses", categoria:"llegum", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Mg1","Jn2"]], trasplantament:[], collita:[["S1","O2"]]}, tags:[], notes:"Sembra per gra; assecat a planta si el temps ho permet.", proteccio_recomanada:false, ordre:12},
    {id:"pesol", nom:"Pèsol", familia:"lleguminoses", categoria:"llegum", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["O1","F2"]], trasplantament:[], collita:[["Mç1","Mg2"]]}, tags:[], notes:"Tutoratge. Molt adequat per tardor-hivern; Mç1 només amb varietat primerenca.", proteccio_recomanada:false, ordre:13},
    {id:"fava", nom:"Fava", familia:"lleguminoses", categoria:"llegum", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["O1","G2"]], trasplantament:[], collita:[["Mç2","Jn1"]]}, tags:[], notes:"Molt adequada a hivern; tutoratge en varietats altes.", proteccio_recomanada:false, ordre:14},

    {id:"enciam", nom:"Enciam", familia:"fulla", categoria:"fulla", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["F1","Jn1"],["Ag2","O2"]], sembra_exterior:[["Mç1","Mg2"],["S1","O2"]], trasplantament:[["Mç2","Jn2"],["S2","N1"]], collita:[["A2","Jl2"],["O1","D2"]]}, tags:["OM","P"], notes:"A ple estiu, millor ombra o varietats d'estiu per evitar espigat. D1–G2 possible amb protecció.", proteccio_recomanada:true, ordre:15},
    {id:"espinac", nom:"Espinac", familia:"fulla", categoria:"fulla", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["S1","Mç2"]], trasplantament:[], collita:[["O1","A2"]]}, tags:["OM","P"], notes:"Evitar l'estiu. A1 possible amb protecció segons l'any.", proteccio_recomanada:true, ordre:16},
    {id:"bleda", nom:"Bleda", familia:"fulla", categoria:"fulla", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["F1","A2"],["Ag1","S2"]], sembra_exterior:[["Mç1","Jn1"],["Ag2","S2"]], trasplantament:[["A1","Jn2"],["S1","O2"]], collita:[["Mg1","D2"]]}, tags:["OM","P"], notes:"G1–F2 possible amb protecció en hivern fred.", proteccio_recomanada:true, ordre:17},
    {id:"canonges", nom:"Canonges", familia:"fulla", categoria:"fulla", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["S2","N2"]], trasplantament:[], collita:[["N2","Mç2"]]}, tags:["P"], notes:"A1 possible amb protecció. Creixement lent.", proteccio_recomanada:true, ordre:18},
    {id:"rucula", nom:"Rúcula", familia:"fulla", categoria:"fulla", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Jn1"],["S1","N1"]], trasplantament:[], collita:[["Mç1","Jn2"],["S2","D2"]]}, tags:["OM"], notes:"Bon cultiu escalonat; tendeix a espigar amb calor.", proteccio_recomanada:false, ordre:19},
    {id:"escarola", nom:"Escarola", familia:"fulla", categoria:"fulla", tipus_implantacio:"ambdues", calendaris:{sembra_interior:[["Ag2","O2"]], sembra_exterior:[["S1","O2"]], trasplantament:[["S2","N1"]], collita:[["N1","F2"]]}, tags:["P"], notes:"Mç1 possible amb protecció. Molt bona per tardor-hivern.", proteccio_recomanada:true, ordre:20},
    {id:"endivia_arrel", nom:"Endívia (arrel)", familia:"fulla", categoria:"fulla", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Mg1","Jn2"]], trasplantament:[], collita:[["S1","O1"]]}, tags:[], notes:"Fase d'obtenció d'arrel per posterior forçat.", proteccio_recomanada:false, ordre:21},
    {id:"endivia_forcat", nom:"Endívia (forçat)", familia:"fulla", categoria:"fulla", tipus_implantacio:"forçat", calendaris:{sembra_interior:[], sembra_exterior:[], trasplantament:[], collita:[["O1","D2"]]}, tags:["P"], notes:"Forçat posterior segons maneig i disponibilitat d'arrels.", proteccio_recomanada:true, ordre:22},

    {id:"col_repols", nom:"Col (repols)", familia:"brassicacies", categoria:"fulla", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F2","A2"],["Jl2","S2"]], sembra_exterior:[], trasplantament:[["A2","Jn1"],["S1","N2"]], collita:[["Jn1","N1"],["Jl2","Mç2"]]}, tags:["P"], notes:"A1 possible amb protecció. Producció principal de tardor-hivern.", proteccio_recomanada:true, ordre:23},
    {id:"coliflor", nom:"Coliflor", familia:"brassicacies", categoria:"flor", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Jn2","S1"],["G2","F2"]], sembra_exterior:[], trasplantament:[["Ag1","O1"]], collita:[["N1","Mç2"]]}, tags:["P"], notes:"Primerenca amb protecció a l'hivern. Evitar pics de calor.", proteccio_recomanada:true, ordre:24},
    {id:"brocoli", nom:"Bròcoli", familia:"brassicacies", categoria:"flor", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Jl2","S2"]], sembra_exterior:[], trasplantament:[["Ag2","N1"]], collita:[["N2","A2"]]}, tags:[], notes:"Collir cap principal i rebrots laterals.", proteccio_recomanada:false, ordre:25},
    {id:"broquil_brots", nom:"Bròquil de brots", familia:"brassicacies", categoria:"flor", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Ag1","S2"]], sembra_exterior:[], trasplantament:[["S1","O2"]], collita:[["N1","A2"]]}, tags:[], notes:"Varietat dependent; molt d'hivern i inici de primavera.", proteccio_recomanada:false, ordre:26},
    {id:"col_brusselles", nom:"Col de Brussel·les", familia:"brassicacies", categoria:"fulla", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Mç2","A2"]], sembra_exterior:[], trasplantament:[["Mg1","Jn1"]], collita:[["N1","F2"]]}, tags:["P"], notes:"Mç1 possible amb protecció. Necessita cicle llarg.", proteccio_recomanada:true, ordre:27},
    {id:"kale", nom:"Kale / col arrissada", familia:"brassicacies", categoria:"fulla", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Mç2","A2"],["Jl2","S2"]], sembra_exterior:[], trasplantament:[["Mg1","Jn1"],["S1","N1"]], collita:[["O1","Mç2"]]}, tags:["P"], notes:"A1 possible amb protecció. Molt rústica.", proteccio_recomanada:true, ordre:28},

    {id:"pastanaga", nom:"Pastanaga", familia:"arrels", categoria:"arrel", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Jn2"],["Ag2","O2"]], trasplantament:[], collita:[["Mg1","N2"]]}, tags:[], notes:"Millor en sòl fi i ben treballat; fer aclarida.", proteccio_recomanada:false, ordre:29},
    {id:"remolatxa", nom:"Remolatxa", familia:"arrels", categoria:"arrel", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Jn2"],["Ag2","O2"]], trasplantament:[], collita:[["Mg1","N2"]]}, tags:[], notes:"Primavera i tardor són les millors èpoques.", proteccio_recomanada:false, ordre:30},
    {id:"nap", nom:"Nap", familia:"arrels", categoria:"arrel", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["S1","N2"],["F2","Mç2"]], trasplantament:[], collita:[["O1","G2"],["A2","Mg2"]]}, tags:[], notes:"Cicle ràpid en temps fresc.", proteccio_recomanada:false, ordre:31},
    {id:"rave", nom:"Rave", familia:"arrels", categoria:"arrel", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Jn2"],["S1","N2"]], trasplantament:[], collita:[["Mç1","Jl2"],["S2","D2"]]}, tags:[], notes:"Escalonar sembres; evitar calor intensa.", proteccio_recomanada:false, ordre:32},
    {id:"xirivia", nom:"Xirivia", familia:"arrels", categoria:"arrel", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Jn1"]], trasplantament:[], collita:[["S1","F2"]]}, tags:["P"], notes:"Cicle llarg; aguanta bé el fred; Mç1 possible amb protecció si l'any és fred.", proteccio_recomanada:true, ordre:33},
    {id:"patata_primerenca", nom:"Patata primerenca", familia:"arrels", categoria:"tuber", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Mç2"]], trasplantament:[], collita:[["Jn1","Jl1"]]}, tags:["P"], notes:"Risc de gelada si es planta massa d'hora.", proteccio_recomanada:true, ordre:34},
    {id:"patata_tardana", nom:"Patata tardana", familia:"arrels", categoria:"tuber", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Ag1","Ag2"]], trasplantament:[], collita:[["N1","N2"]]}, tags:["RG"], notes:"Cicle tardà; necessita reg i control del míldiu.", proteccio_recomanada:false, ordre:35},

    {id:"ceba_bulb", nom:"Ceba bulb", familia:"bulbs_tiges", categoria:"bulb", tipus_implantacio:"planter", calendaris:{sembra_interior:[["G2","Mç2"]], sembra_exterior:[], trasplantament:[["F2","A2"]], collita:[["Jn1","Ag2"]]}, tags:[], notes:"Varietat determinant; curat en sec per guardar.", proteccio_recomanada:false, ordre:36},
    {id:"ceba_tendra", nom:"Ceba tendra", familia:"bulbs_tiges", categoria:"bulb", tipus_implantacio:"planter", calendaris:{sembra_interior:[["S1","N1"],["G2","Mç2"]], sembra_exterior:[], trasplantament:[["O1","D1"],["F2","A2"]], collita:[["N1","Mg1"]]}, tags:[], notes:"Cicle específic per a ceba tendra; ajustar segons varietat.", proteccio_recomanada:false, ordre:37},
    {id:"all", nom:"All", familia:"bulbs_tiges", categoria:"bulb", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["O1","G2"]], trasplantament:[], collita:[["Jn1","Jl2"]]}, tags:[], notes:"Evitar excés d'aigua al final i fer rotació.", proteccio_recomanada:false, ordre:38},
    {id:"porro", nom:"Porro", familia:"bulbs_tiges", categoria:"tija", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","A2"],["Ag1","S2"]], sembra_exterior:[], trasplantament:[["Mg1","Jl2"],["O1","N1"]], collita:[["O1","Mç2"]]}, tags:["P"], notes:"A1 possible amb protecció. Aporcar per blanquejar.", proteccio_recomanada:true, ordre:39},
    {id:"api", nom:"Api", familia:"bulbs_tiges", categoria:"tija", tipus_implantacio:"planter", calendaris:{sembra_interior:[["F1","A1"]], sembra_exterior:[], trasplantament:[["A2","Jn1"]], collita:[["Jl1","N2"]]}, tags:["RG"], notes:"Exigent d'aigua; pateix amb calor extrema.", proteccio_recomanada:false, ordre:40},
    {id:"fonoll", nom:"Fonoll", familia:"bulbs_tiges", categoria:"bulb", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Ag2","O2"]], trasplantament:[], collita:[["N1","F2"]]}, tags:["P"], notes:"Mç1 possible amb protecció. Millor a tardor-hivern.", proteccio_recomanada:true, ordre:41},

    {id:"blat_moro", nom:"Blat de moro dolç", familia:"altres", categoria:"cereal", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["A2","Jn1"]], trasplantament:[], collita:[["Jl2","S2"]]}, tags:["SF","RG"], notes:"Sembra en blocs per afavorir pol·linització; reg clau.", proteccio_recomanada:false, ordre:42},
    {id:"girasol", nom:"Gira-sol", familia:"altres", categoria:"flor", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Mç2","Mg2"]], trasplantament:[], collita:[["Ag1","S2"]]}, tags:[], notes:"Baix manteniment; necessita espai i sol.", proteccio_recomanada:false, ordre:43},

    {id:"alfabrega", nom:"Alfàbrega", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"planter", calendaris:{sembra_interior:[["Mç2","Mg2"]], sembra_exterior:[], trasplantament:[["Mg1","Jn1"]], collita:[["Jn1","S2"]]}, tags:["SF"], notes:"No tolera el fred; molt bona associada al tomàquet.", proteccio_recomanada:false, ordre:44},
    {id:"julivert", nom:"Julivert", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F1","Jn2"],["S1","N2"]], trasplantament:[], collita:[["A1","D2"]]}, tags:["P"], notes:"G1–F2 possible amb protecció; germinació lenta.", proteccio_recomanada:true, ordre:45},
    {id:"cilantre", nom:"Cilantre", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["F2","Mg2"],["S1","O2"]], trasplantament:[], collita:[["Mç2","Jn1"],["S2","N1"]]}, tags:["OM"], notes:"Amb calor espiga; millor primavera i tardor.", proteccio_recomanada:false, ordre:46},
    {id:"anet", nom:"Anet", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"directa", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Jn1"],["S1","O1"]], trasplantament:[], collita:[["A2","Jl2"],["S2","N2"]]}, tags:[], notes:"Fàcil de cultivar; va bé escalonar sembres.", proteccio_recomanada:false, ordre:47},
    {id:"farigola", nom:"Farigola (plantació)", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembla_exterior:[["Mç1","Mg2"]], trasplantament:[], collita:[["Mg1","O2"]]}, tags:[], notes:"Perenne; collita principal a primavera-estiu.", proteccio_recomanada:false, ordre:48},
    {id:"romani", nom:"Romaní (plantació)", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Mg2"]], trasplantament:[], collita:[["Mg1","O2"]]}, tags:[], notes:"Perenne; admet podes lleugeres.", proteccio_recomanada:false, ordre:49},
    {id:"salvia", nom:"Sàlvia (plantació)", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Mg2"]], trasplantament:[], collita:[["Mg1","O2"]]}, tags:[], notes:"Perenne; collita principal de primavera-estiu.", proteccio_recomanada:false, ordre:50},
    {id:"orenga", nom:"Orenga (plantació)", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Mg2"]], trasplantament:[], collita:[["Mg1","O2"]]}, tags:[], notes:"Perenne; millor amb sol i bon drenatge.", proteccio_recomanada:false, ordre:51},
    {id:"menta", nom:"Menta (plantació)", familia:"aromatiques", categoria:"aromàtica", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembra_exterior:[["Mç1","Jn1"]], trasplantament:[], collita:[["Mg1","O2"]]}, tags:["RG"], notes:"S'expandeix molt; millor en test o zona delimitada.", proteccio_recomanada:false, ordre:52},

    {id:"calcot", nom:"Calçot (plantació de bulb)", familia:"calcot", categoria:"especial", tipus_implantacio:"plantació", calendaris:{sembra_interior:[], sembra_exterior:[["Ag1","S2"]], trasplantament:[], collita:[["N1","Mç2"]]}, tags:[], notes:"Fer aporcats repetits de S2 a N1. Pics de collita habituals de D1 a F2.", proteccio_recomanada:false, ordre:53},
    {id:"ceba_mare_calcot", nom:"Ceba mare per a calçot", familia:"calcot", categoria:"especial", tipus_implantacio:"planter", calendaris:{sembra_interior:[["G2","Mç2"]], sembra_exterior:[], trasplantament:[["F2","A2"]], collita:[["Jn1","Ag2"]]}, tags:[], notes:"Bulb per replantar posteriorment com a calçot a Ag1–S2.", proteccio_recomanada:false, ordre:54}
  ]
};

const MC_PHASES = [
  { key: "sembra_interior", label: "SI", cls: "si", long: "Sembra interior" },
  { key: "sembra_exterior", label: "SE", cls: "se", long: "Sembra exterior" },
  { key: "trasplantament", label: "TR", cls: "tr", long: "Trasplantament" },
  { key: "collita", label: "CO", cls: "co", long: "Collita" }
];

const MC_HALF_ORDER = Object.fromEntries(CALENDARI_DATA.meta.codi_quinzenes.map((k, i) => [k, i]));
const MC_FAMILY_MAP = Object.fromEntries(CALENDARI_DATA.families.map((f) => [f.id, f]));

const mcState = {
  view: "cards",
  q: "",
  family: "all",
  tag: "all",
  phase: "all",
  half: "all",
  showNotes: true
};

const byId = (id) => document.getElementById(id);
const qsa = (sel) => [...document.querySelectorAll(sel)];
const esc = (s) => String(s || "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[m]));
const famColor = (id) => `var(--mc-${id})`;

function normalizeDataset() {
  CALENDARI_DATA.crops.forEach((crop) => {
    if (!crop.calendaris) crop.calendaris = {};
    if (crop.calendaris.sembla_exterior && !crop.calendaris.sembra_exterior) {
      crop.calendaris.sembra_exterior = crop.calendaris.sembla_exterior;
    }
    delete crop.calendaris.sembla_exterior;
  });
}

function phaseRanges(crop, phaseKey) {
  const arr = crop.calendaris[phaseKey] || [];
  return arr.map(([a, b]) => (a === b ? a : `${a}–${b}`));
}

function inRange(code, start, end) {
  const i = MC_HALF_ORDER[code];
  const a = MC_HALF_ORDER[start];
  const b = MC_HALF_ORDER[end];
  return Number.isInteger(i) && Number.isInteger(a) && Number.isInteger(b) && i >= a && i <= b;
}

function cropHasHalf(crop, code, phaseKey = "all") {
  const keys = phaseKey === "all" ? MC_PHASES.map((p) => p.key) : [phaseKey];
  return keys.some((k) => (crop.calendaris[k] || []).some(([a, b]) => inRange(code, a, b)));
}

function cropMatches(crop) {
  const familyName = MC_FAMILY_MAP[crop.familia]?.nom || "";
  const haystack = [crop.nom, crop.notes, familyName, crop.categoria, crop.tipus_implantacio, crop.tags.join(" ")].join(" ").toLowerCase();

  return (!mcState.q || haystack.includes(mcState.q.toLowerCase()))
    && (mcState.family === "all" || crop.familia === mcState.family)
    && (mcState.tag === "all" || crop.tags.includes(mcState.tag))
    && (mcState.phase === "all" || (crop.calendaris[mcState.phase] || []).length > 0)
    && (mcState.half === "all" || cropHasHalf(crop, mcState.half, mcState.phase));
}

function getCrops() {
  return CALENDARI_DATA.crops
    .filter(cropMatches)
    .sort((a, b) => (MC_FAMILY_MAP[a.familia].ordre - MC_FAMILY_MAP[b.familia].ordre) || (a.ordre - b.ordre) || a.nom.localeCompare(b.nom));
}

function renderMeta() {
  byId("mcMetaPills").innerHTML = [
    `<span class="pill">Zona: <b>${CALENDARI_DATA.meta.zona}</b></span>`,
    `<span class="pill">Unitat: <b>${CALENDARI_DATA.meta.unitat_temporal}</b></span>`,
    `<span class="pill">Cultius: <b>${CALENDARI_DATA.crops.length}</b></span>`
  ].join("");

  byId("mcLegendTags").innerHTML = Object.entries(CALENDARI_DATA.meta.llegenda_tags)
    .map(([k, v]) => `<div class="legend-chip"><b>${k}</b> ${esc(v)}</div>`)
    .join("");
}

function fillFilters() {
  byId("mcFamily").innerHTML = `<option value="all">Totes les famílies</option>` + CALENDARI_DATA.families.map((f) => `<option value="${f.id}">${f.nom}</option>`).join("");
  byId("mcTag").innerHTML = `<option value="all">Totes les etiquetes</option>` + Object.keys(CALENDARI_DATA.meta.llegenda_tags).map((k) => `<option value="${k}">${k}</option>`).join("");
  byId("mcPhase").innerHTML = `<option value="all">Qualsevol fase</option>` + MC_PHASES.map((p) => `<option value="${p.key}">${p.long}</option>`).join("");
  byId("mcHalf").innerHTML = `<option value="all">Tot l'any</option>` + CALENDARI_DATA.meta.codi_quinzenes.map((k) => `<option value="${k}">${k}</option>`).join("");
}

function statCard(n, label) {
  return `<article class="card stat-card"><b>${n}</b><span>${label}</span></article>`;
}

function renderStats(crops) {
  const visibleFamilies = new Set(crops.map((c) => c.familia)).size;
  const withProtection = crops.filter((c) => c.proteccio_recomanada).length;
  const withWaterDemand = crops.filter((c) => c.tags.includes("RG")).length;

  byId("mcStats").innerHTML = [
    statCard(crops.length, "cultius visibles"),
    statCard(visibleFamilies, "famílies representades"),
    statCard(withProtection, "amb protecció recomanada"),
    statCard(withWaterDemand, "amb reg exigent")
  ].join("");
}

function cropCard(crop) {
  return `
    <article class="card crop-card" style="--mc-fam-color:${famColor(crop.familia)}">
      <div class="crop-top">
        <div>
          <div class="crop-name">${esc(crop.nom)}</div>
          <div class="crop-sub">${esc(MC_FAMILY_MAP[crop.familia].nom)} · ${esc(crop.tipus_implantacio)}</div>
        </div>
        <span class="cat-chip">${esc(crop.categoria)}</span>
      </div>

      <div class="crop-tags">
        ${crop.tags.map((t) => `<span class="tag" data-tag="${t}">${t}</span>`).join("") || '<span class="tag">sense etiqueta</span>'}
      </div>

      <div class="phase-list">
        ${MC_PHASES.map((p) => `
          <div class="phase-row">
            <b>${p.label}</b>
            <div class="phase-badges">
              ${phaseRanges(crop, p.key).map((r) => `<span class="phase-chip ${p.cls}">${r}</span>`).join("") || '<span class="small">—</span>'}
            </div>
          </div>
        `).join("")}
      </div>

      <div class="crop-notes ${mcState.showNotes ? "" : "hidden"}">${esc(crop.notes)}</div>
    </article>
  `;
}

function renderCards(crops) {
  byId("mcViewCards").innerHTML = `<div class="crop-grid">${crops.map(cropCard).join("")}</div>`;
}

function renderFamilies(crops) {
  const groups = CALENDARI_DATA.families
    .map((f) => ({ ...f, items: crops.filter((c) => c.familia === f.id) }))
    .filter((g) => g.items.length);

  byId("mcViewFamilies").innerHTML = groups.map((g) => `
    <section class="family-block" style="--mc-fam-color:${famColor(g.id)}">
      <div class="family-head">
        <div class="family-title"><span class="family-dot"></span><h3>${esc(g.nom)}</h3></div>
        <div class="small">${g.items.length} cultius</div>
      </div>
      <div class="crop-grid">${g.items.map(cropCard).join("")}</div>
    </section>
  `).join("") || `<article class="card" style="padding:18px">Sense resultats.</article>`;
}

function renderTable(crops) {
  byId("mcViewTable").innerHTML = `
    <div class="card table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>Cultiu</th>
            <th>Família</th>
            <th>SI</th>
            <th>SE</th>
            <th>TR</th>
            <th>CO</th>
            <th>Etiquetes</th>
            <th class="${mcState.showNotes ? "" : "hidden"}">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${crops.map((c) => `
            <tr>
              <td><b>${esc(c.nom)}</b><div class="small">${esc(c.tipus_implantacio)}</div></td>
              <td>${esc(MC_FAMILY_MAP[c.familia].nom)}</td>
              <td>${phaseRanges(c, "sembra_interior").join(" · ") || "—"}</td>
              <td>${phaseRanges(c, "sembra_exterior").join(" · ") || "—"}</td>
              <td>${phaseRanges(c, "trasplantament").join(" · ") || "—"}</td>
              <td>${phaseRanges(c, "collita").join(" · ") || "—"}</td>
              <td>${c.tags.join(", ") || "—"}</td>
              <td class="${mcState.showNotes ? "" : "hidden"}">${esc(c.notes)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
    }
function ganttCellClass(crop, half) {
  const active = MC_PHASES.filter((p) => cropHasHalf(crop, half, p.key)).map((p) => p.cls);
  if (!active.length) return "";
  if (active.length === 1) return active[0];
  return "mix";
}

function renderGantt(crops) {
  byId("mcViewGantt").innerHTML = `
    <div class="card gantt-wrap">
      <div class="gantt">
        <div class="g-head">
          <div>Cultiu</div>
          ${CALENDARI_DATA.meta.codi_quinzenes.map((h) => `<div class="small">${h}</div>`).join("")}
        </div>
        ${crops.map((c) => `
          <div class="g-row">
            <div class="g-crop">${esc(c.nom)}<span class="small">${esc(MC_FAMILY_MAP[c.familia].nom)}</span></div>
            ${CALENDARI_DATA.meta.codi_quinzenes.map((h) => `<div class="g-cell ${ganttCellClass(c, h)}"></div>`).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderMobile(crops) {
  byId("mcViewMobile").innerHTML = `
    <div class="mobile-list">
      ${crops.map((c) => `
        <article class="card mobile-card">
          <div class="mobile-head">
            <div>
              <div class="crop-name">${esc(c.nom)}</div>
              <div class="crop-sub">${esc(MC_FAMILY_MAP[c.familia].nom)}</div>
            </div>
            <div class="crop-tags">${c.tags.map((t) => `<span class="tag" data-tag="${t}">${t}</span>`).join("")}</div>
          </div>
          <div class="mobile-bars">
            ${MC_PHASES.map((p) => `
              <div class="mobile-row">
                <b>${p.label}</b>
                <div class="mobile-bar">${CALENDARI_DATA.meta.codi_quinzenes.map((h) => `<span class="mobile-dot ${cropHasHalf(c, h, p.key) ? p.cls : ""}"></span>`).join("")}</div>
              </div>
            `).join("")}
          </div>
          <div class="mobile-months">${CALENDARI_DATA.meta.mesos.map((m) => `<span>${m}</span>`).join("")}</div>
          <div class="crop-notes ${mcState.showNotes ? "" : "hidden"}" style="margin-top:10px">${esc(c.notes)}</div>
        </article>
      `).join("")}
    </div>
  `;
}

function setActiveView() {
  qsa(".mc-view").forEach((v) => v.classList.remove("active"));
  const id = `mcView${mcState.view.charAt(0).toUpperCase()}${mcState.view.slice(1)}`;
  byId(id)?.classList.add("active");
  qsa("[data-mc-view-btn]").forEach((btn) => btn.classList.toggle("active", btn.dataset.mcViewBtn === mcState.view));
}

function render() {
  const crops = getCrops();
  renderStats(crops);
  renderCards(crops);
  renderFamilies(crops);
  renderTable(crops);
  renderGantt(crops);
  renderMobile(crops);
  setActiveView();
}

function bind() {
  byId("mcQ")?.addEventListener("input", (e) => { mcState.q = e.target.value.trim(); render(); });
  byId("mcFamily")?.addEventListener("change", (e) => { mcState.family = e.target.value; render(); });
  byId("mcTag")?.addEventListener("change", (e) => { mcState.tag = e.target.value; render(); });
  byId("mcPhase")?.addEventListener("change", (e) => { mcState.phase = e.target.value; render(); });
  byId("mcHalf")?.addEventListener("change", (e) => { mcState.half = e.target.value; render(); });

  byId("mcClear")?.addEventListener("click", () => {
    mcState.q = "";
    mcState.family = "all";
    mcState.tag = "all";
    mcState.phase = "all";
    mcState.half = "all";

    byId("mcQ").value = "";
    byId("mcFamily").value = "all";
    byId("mcTag").value = "all";
    byId("mcPhase").value = "all";
    byId("mcHalf").value = "all";
    render();
  });

  byId("mcToggleNotes")?.addEventListener("click", () => {
    mcState.showNotes = !mcState.showNotes;
    byId("mcToggleNotes").textContent = mcState.showNotes ? "Amaga notes" : "Mostra notes";
    render();
  });

  qsa("[data-mc-view-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mcState.view = btn.dataset.mcViewBtn;
      render();
    });
  });
}

export function initCalendariPage() {
  if (!byId("mcMetaPills")) return;
  normalizeDataset();
  renderMeta();
  fillFilters();
  bind();
  render();
                                    }
