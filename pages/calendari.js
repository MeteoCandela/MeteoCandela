/* calendar.js — MeteoCandela · Hort (v5)
   - Elimina targetes d'estadístiques (53/21/32/quinzena)
   - Posa la quinzena al títol: "Calendari de cultius de l'Alt Camp - 2a quinzena Febrer"
   - "Calendari resumit" amb swatch de color (blau/verd/groc/rosa) davant del text, com la llegenda
   - Manté filtres, vistes (Targetes/Famílies/Taula/Gantt/Mòbil) i notes desplegables
*/

const MC_DATA = [{"cultiu":"Tomàquet","familia":"Solanàcies","tipus":"fruit","etiquetes":["fred","reg regular","vent","protecció"],"notes":"A1 possible amb protecció. Tutoratge, mulch i reg regular.","SI_ini":"F1","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"A2","TR_fi":"Mg2","CO_ini":"Jn2","CO_fi":"O2"},{"cultiu":"Pebrot","familia":"Solanàcies","tipus":"fruit","etiquetes":["fred","reg regular","vent","protecció"],"notes":"A2 possible amb protecció i microclima arrecerat. Molt sensible al fred.","SI_ini":"F1","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"Mg1","TR_fi":"Mg2","CO_ini":"Jl1","CO_fi":"O2"},{"cultiu":"Albergínia","familia":"Solanàcies","tipus":"fruit","etiquetes":["fred","reg regular","vent","protecció"],"notes":"A2 possible amb protecció. Necessita calor sostinguda.","SI_ini":"F1","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"Jl1","CO_fi":"O2"},{"cultiu":"Tomàquet de penjar","familia":"Solanàcies","tipus":"fruit","etiquetes":["fred","reg regular","vent"],"notes":"Mateix calendari base que el tomàquet; collita orientada a conservació.","SI_ini":"F1","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"A2","TR_fi":"Mg2","CO_ini":"Jl1","CO_fi":"O2"},{"cultiu":"Carbassó","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt"],"notes":"A1 possible amb protecció. Vigilar oïdi; collir sovint.","SI_ini":"Mç2","SI_fi":"A2","SE_ini":"A2","SE_fi":"Jn1","TR_ini":"A2","TR_fi":"Jn1","CO_ini":"Jn2","CO_fi":"S2"},{"cultiu":"Cogombre","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt","tutoratge"],"notes":"Tutoratge si enfiladís; sensible al fred.","SI_ini":"A1","SI_fi":"A2","SE_ini":"Mg1","SE_fi":"Jn1","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"Jn2","CO_fi":"S2"},{"cultiu":"Meló","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt"],"notes":"Reg controlat; reduir a final per millorar dolçor.","SI_ini":"A1","SI_fi":"A2","SE_ini":"Mg1","SE_fi":"Mg2","TR_ini":"Mg1","TR_fi":"Mg2","CO_ini":"Jl2","CO_fi":"S2"},{"cultiu":"Síndria","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt"],"notes":"Molt termòfila; millor en sòl ben drenat.","SI_ini":"A1","SI_fi":"A2","SE_ini":"Mg1","SE_fi":"Mg2","TR_ini":"Mg1","TR_fi":"Mg2","CO_ini":"Ag1","CO_fi":"S2"},{"cultiu":"Carbassa","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt"],"notes":"Necessita espai; collir quan la pell és dura.","SI_ini":"A1","SI_fi":"A2","SE_ini":"Mg1","SE_fi":"Jn1","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"S2","CO_fi":"N2"},{"cultiu":"Carbassó d'hivern","familia":"Cucurbitàcies","tipus":"fruit","etiquetes":["fred","reg alt"],"notes":"Varietats de guarda; calendari similar a carbassa.","SI_ini":"A1","SI_fi":"A2","SE_ini":"Mg1","SE_fi":"Jn1","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"S2","CO_fi":"N2"},{"cultiu":"Vajoca","familia":"Lleguminoses","tipus":"llegum","etiquetes":["fred inicial"],"notes":"Escalonar sembres cada 2–3 setmanes; germina millor amb sòl calent.","SI_ini":"A2","SI_fi":"Mg2","SE_ini":"A2","SE_fi":"Jl2","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"Jn2","CO_fi":"O1"},{"cultiu":"Fesols","familia":"Lleguminoses","tipus":"llegum","etiquetes":["sembra directa"],"notes":"Sembra per gra; assecat a planta si el temps ho permet.","SI_ini":"","SI_fi":"","SE_ini":"Mg1","SE_fi":"Jn2","TR_ini":"","TR_fi":"","CO_ini":"S1","CO_fi":"O2"},{"cultiu":"Pèsol","familia":"Lleguminoses","tipus":"llegum","etiquetes":["fred","tutoratge"],"notes":"Ideal tardor-hivern. Mç1 possible amb varietat primerenca.","SI_ini":"","SI_fi":"","SE_ini":"O1","SE_fi":"F2","TR_ini":"","TR_fi":"","CO_ini":"Mç1","CO_fi":"Mg2"},{"cultiu":"Fava","familia":"Lleguminoses","tipus":"llegum","etiquetes":["fred","tutoratge"],"notes":"Molt adequada a hivern; tutoratge en varietats altes.","SI_ini":"","SI_fi":"","SE_ini":"O1","SE_fi":"G2","TR_ini":"","TR_fi":"","CO_ini":"Mç2","CO_fi":"Jn1"},{"cultiu":"Enciam","familia":"Fulla","tipus":"fulla","etiquetes":["ombra estiu","reg regular"],"notes":"A ple estiu convé ombra parcial i varietats resistents a espigar. D1–G2 possible amb protecció.","SI_ini":"F1;Ag2","SI_fi":"Jn1;O2","SE_ini":"Mç1;S1","SE_fi":"Mg2;O2","TR_ini":"Mç2;S2","TR_fi":"Jn2;N1","CO_ini":"A2;O1","CO_fi":"Jl2;D2"},{"cultiu":"Espinac","familia":"Fulla","tipus":"fulla","etiquetes":["fred","evitar estiu"],"notes":"Evitar estiu; A1 possible amb protecció segons any.","SI_ini":"","SI_fi":"","SE_ini":"S1","SE_fi":"Mç2","TR_ini":"","TR_fi":"","CO_ini":"O1","CO_fi":"A2"},{"cultiu":"Bleda","familia":"Fulla","tipus":"fulla","etiquetes":["rústica","ombra estiu"],"notes":"G1–F2 possible amb protecció en hivern fred.","SI_ini":"F1;Ag1","SI_fi":"A2;S2","SE_ini":"Mç1;Ag2","SE_fi":"Jn1;S2","TR_ini":"A1;S1","TR_fi":"Jn2;O2","CO_ini":"Mg1","CO_fi":"D2"},{"cultiu":"Canonges","familia":"Fulla","tipus":"fulla","etiquetes":["fred"],"notes":"A1 possible amb protecció; creixement lent.","SI_ini":"","SI_fi":"","SE_ini":"S2","SE_fi":"N2","TR_ini":"","TR_fi":"","CO_ini":"N2","CO_fi":"Mç2"},{"cultiu":"Rúcula","familia":"Fulla","tipus":"fulla","etiquetes":["ombra estiu"],"notes":"Bon cultiu escalonat; tendeix a espigar amb calor.","SI_ini":"","SI_fi":"","SE_ini":"F2;S1","SE_fi":"Jn1;N1","TR_ini":"","TR_fi":"","CO_ini":"Mç1;S2","CO_fi":"Jn2;D2"},{"cultiu":"Escarola","familia":"Fulla","tipus":"fulla","etiquetes":["fred"],"notes":"Mç1 possible amb protecció. Bona per tardor-hivern.","SI_ini":"Ag2","SI_fi":"O2","SE_ini":"S1","SE_fi":"O2","TR_ini":"S2","TR_fi":"N1","CO_ini":"N1","CO_fi":"F2"},{"cultiu":"Endívia (arrel + forçat)","familia":"Fulla","tipus":"fulla","etiquetes":["forçat"],"notes":"Arrel: collita S1–O1. Forçat posterior: O1–D2 segons maneig.","SI_ini":"","SI_fi":"","SE_ini":"Mg1","SE_fi":"Jn2","TR_ini":"","TR_fi":"","CO_ini":"S1","CO_fi":"O1"},{"cultiu":"Col (repols)","familia":"Brassicàcies","tipus":"fulla","etiquetes":["fred","tardor-hivern"],"notes":"A1 possible amb protecció. Producció principal tardor-hivern.","SI_ini":"F2;Jl2","SI_fi":"A2;S2","SE_ini":"","SE_fi":"","TR_ini":"A2;S1","TR_fi":"Jn1;N2","CO_ini":"Jn1;N1","CO_fi":"Jl2;Mç2"},{"cultiu":"Coliflor","familia":"Brassicàcies","tipus":"flor","etiquetes":["fred","protecció"],"notes":"Primerenca amb protecció (G2–F2). Evitar pics de calor.","SI_ini":"Jn2;G2","SI_fi":"S1;F2","SE_ini":"","SE_fi":"","TR_ini":"Ag1","TR_fi":"O1","CO_ini":"N1","CO_fi":"Mç2"},{"cultiu":"Bròcoli","familia":"Brassicàcies","tipus":"flor","etiquetes":["fred"],"notes":"Collir cap principal i rebrots.","SI_ini":"Jl2","SI_fi":"S2","SE_ini":"","SE_fi":"","TR_ini":"Ag2","TR_fi":"N1","CO_ini":"N2","CO_fi":"A2"},{"cultiu":"Bròquil (brotonera)","familia":"Brassicàcies","tipus":"flor","etiquetes":["fred"],"notes":"Varietat dependent; molt d’hivern-inici primavera.","SI_ini":"Ag1","SI_fi":"S2","SE_ini":"","SE_fi":"","TR_ini":"S1","TR_fi":"O2","CO_ini":"N1","CO_fi":"A2"},{"cultiu":"Col de Brussel·les","familia":"Brassicàcies","tipus":"fulla","etiquetes":["cicle llarg","fred"],"notes":"Mç1 possible amb protecció. Necessita cicle llarg.","SI_ini":"Mç2","SI_fi":"A2","SE_ini":"","SE_fi":"","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"N1","CO_fi":"F2"},{"cultiu":"Kale / col arrissada","familia":"Brassicàcies","tipus":"fulla","etiquetes":["rústica","fred"],"notes":"A1 possible amb protecció. Molt resistent.","SI_ini":"Mç2;Jl2","SI_fi":"A2;S2","SE_ini":"","SE_fi":"","TR_ini":"Mg1;S1","TR_fi":"Jn1;N1","CO_ini":"O1","CO_fi":"Mç2"},{"cultiu":"Pastanaga","familia":"Arrels","tipus":"arrel","etiquetes":["sembra directa"],"notes":"Millor sòl fi; necessita aclarida.","SI_ini":"","SI_fi":"","SE_ini":"F2;Ag2","SE_fi":"Jn2;O2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"N2"},{"cultiu":"Remolatxa","familia":"Arrels","tipus":"arrel","etiquetes":["sembra directa"],"notes":"Primavera i tardor ideals.","SI_ini":"","SI_fi":"","SE_ini":"F2;Ag2","SE_fi":"Jn2;O2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"N2"},{"cultiu":"Nap","familia":"Arrels","tipus":"arrel","etiquetes":["sembra directa","fred"],"notes":"Cicle ràpid en temps fresc.","SI_ini":"","SI_fi":"","SE_ini":"S1;F2","SE_fi":"N2;Mç2","TR_ini":"","TR_fi":"","CO_ini":"O1;A2","CO_fi":"G2;Mg2"},{"cultiu":"Rave","familia":"Arrels","tipus":"arrel","etiquetes":["sembra directa"],"notes":"Escalonar sembres; evitar calor intensa.","SI_ini":"","SI_fi":"","SE_ini":"F2;S1","SE_fi":"Jn2;N2","TR_ini":"","TR_fi":"","CO_ini":"Mç1;S2","CO_fi":"Jl2;D2"},{"cultiu":"Xirivia","familia":"Arrels","tipus":"arrel","etiquetes":["cicle llarg","fred"],"notes":"Aguanta fred; Mç1 possible amb protecció.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Jn1","TR_ini":"","TR_fi":"","CO_ini":"S1","CO_fi":"F2"},{"cultiu":"Patata","familia":"Arrels","tipus":"tubercle","etiquetes":["plantació","fred"],"notes":"Plantació principal a finals d’hivern. Risc de gelada si es fa massa d’hora. Cicle tardà a Ag1–Ag2.","SI_ini":"","SI_fi":"","SE_ini":"F2","SE_fi":"Mç2","TR_ini":"","TR_fi":"","CO_ini":"Jn1","CO_fi":"Jl1"},{"cultiu":"Patata tardana","familia":"Arrels","tipus":"tubercle","etiquetes":["plantació","reg"],"notes":"Cicle tardà; vigilar reg i míldiu.","SI_ini":"","SI_fi":"","SE_ini":"Ag1","SE_fi":"Ag2","TR_ini":"","TR_fi":"","CO_ini":"N1","CO_fi":"N2"},{"cultiu":"Ceba bulb","familia":"Bulbs i tiges","tipus":"bulb","etiquetes":["curat"],"notes":"Varietat determinant; curat en sec per guardar.","SI_ini":"G2","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"F2","TR_fi":"A2","CO_ini":"Jn1","CO_fi":"Ag2"},{"cultiu":"Ceba tendra","familia":"Bulbs i tiges","tipus":"bulb","etiquetes":["fred"],"notes":"Cicle per ceba tendra; ajustar segons varietat.","SI_ini":"S1;G2","SI_fi":"N1;Mç2","SE_ini":"","SE_fi":"","TR_ini":"O1;F2","TR_fi":"D1;A2","CO_ini":"N1","CO_fi":"Mg1"},{"cultiu":"All","familia":"Bulbs i tiges","tipus":"bulb","etiquetes":["plantació","poc reg final"],"notes":"Evitar excés d’aigua al final del cicle; important rotació.","SI_ini":"","SI_fi":"","SE_ini":"O1","SE_fi":"G2","TR_ini":"","TR_fi":"","CO_ini":"Jn1","CO_fi":"Jl2"},{"cultiu":"Porro","familia":"Bulbs i tiges","tipus":"tija","etiquetes":["calçar","fred"],"notes":"A1 possible amb protecció. Calçar per blanquejar.","SI_ini":"F1;Ag1","SI_fi":"A2;S2","SE_ini":"","SE_fi":"","TR_ini":"Mg1;O1","TR_fi":"Jl2;N1","CO_ini":"O1","CO_fi":"Mç2"},{"cultiu":"Api","familia":"Bulbs i tiges","tipus":"tija","etiquetes":["reg alt"],"notes":"Exigent d’aigua; pateix calor extrema.","SI_ini":"F1","SI_fi":"A1","SE_ini":"","SE_fi":"","TR_ini":"A2","TR_fi":"Jn1","CO_ini":"Jl1","CO_fi":"N2"},{"cultiu":"Fonoll","familia":"Bulbs i tiges","tipus":"bulb","etiquetes":["fred"],"notes":"Mç1 possible amb protecció. Millor a tardor-hivern.","SI_ini":"","SI_fi":"","SE_ini":"Ag2","SE_fi":"O2","TR_ini":"","TR_fi":"","CO_ini":"N1","CO_fi":"F2"},{"cultiu":"Blat de moro dolç","familia":"Altres (grans)","tipus":"gra","etiquetes":["reg alt","fred inicial"],"notes":"Sembra en blocs per afavorir pol·linització.","SI_ini":"","SI_fi":"","SE_ini":"A2","SE_fi":"Jn1","TR_ini":"","TR_fi":"","CO_ini":"Jl2","CO_fi":"S2"},{"cultiu":"Gira-sol","familia":"Altres (grans)","tipus":"llavor","etiquetes":["sol"],"notes":"Baix manteniment; necessita espai.","SI_ini":"","SI_fi":"","SE_ini":"Mç2","SE_fi":"Mg2","TR_ini":"","TR_fi":"","CO_ini":"Ag1","CO_fi":"S2"},{"cultiu":"Alfàbrega","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["fred","companya tomàquet"],"notes":"No tolera fred; molt bona associació amb tomàquet.","SI_ini":"Mç2","SI_fi":"Mg2","SE_ini":"","SE_fi":"","TR_ini":"Mg1","TR_fi":"Jn1","CO_ini":"Jn1","CO_fi":"S2"},{"cultiu":"Julivert","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["germinació lenta"],"notes":"G1–F2 possible amb protecció.","SI_ini":"","SI_fi":"","SE_ini":"F1;S1","SE_fi":"Jn2;N2","TR_ini":"","TR_fi":"","CO_ini":"A1","CO_fi":"D2"},{"cultiu":"Cilantre","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["espiga amb calor"],"notes":"Millor primavera i tardor.","SI_ini":"","SI_fi":"","SE_ini":"F2;S1","SE_fi":"Mg2;O2","TR_ini":"","TR_fi":"","CO_ini":"Mç2;S2","CO_fi":"Jn1;N1"},{"cultiu":"Anet","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["escalonable"],"notes":"Fàcil de cultivar; pots escalonar sembres.","SI_ini":"","SI_fi":"","SE_ini":"Mç1;S1","SE_fi":"Jn1;O1","TR_ini":"","TR_fi":"","CO_ini":"A2;S2","CO_fi":"Jl2;N2"},{"cultiu":"Farigola (plantació)","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["perenne"],"notes":"Perenne; collita principal primavera-estiu.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Mg2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"O2"},{"cultiu":"Romaní (plantació)","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["perenne"],"notes":"Perenne; podes lleugeres.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Mg2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"O2"},{"cultiu":"Sàlvia (plantació)","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["perenne"],"notes":"Perenne; collita principal primavera-estiu.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Mg2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"O2"},{"cultiu":"Orenga (plantació)","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["perenne"],"notes":"Perenne; millor en sol i drenatge.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Mg2","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"O2"},{"cultiu":"Menta (plantació)","familia":"Aromàtiques","tipus":"aromàtica","etiquetes":["reg","invasiva"],"notes":"Millor en test o delimitada.","SI_ini":"","SI_fi":"","SE_ini":"Mç1","SE_fi":"Jn1","TR_ini":"","TR_fi":"","CO_ini":"Mg1","CO_fi":"O2"},{"cultiu":"Calçot (plantació bulb)","familia":"Calçot","tipus":"bulb","etiquetes":["plantació","calçar"],"notes":"Calçar S2–N1 diverses vegades. Pics de collita D1–F2.","SI_ini":"","SI_fi":"","SE_ini":"Ag1","SE_fi":"S2","TR_ini":"","TR_fi":"","CO_ini":"N1","CO_fi":"Mç2"},{"cultiu":"Ceba mare per calçot (si la produeixes)","familia":"Calçot","tipus":"bulb","etiquetes":["plantació"],"notes":"Bulb per replantar com a calçot a Ag1–S2.","SI_ini":"G2","SI_fi":"Mç2","SE_ini":"","SE_fi":"","TR_ini":"F2","TR_fi":"A2","CO_ini":"Jn1","CO_fi":"Ag2"}];

const MC_ORDER = ["G1","G2","F1","F2","Mç1","Mç2","A1","A2","Mg1","Mg2","Jn1","Jn2","Jl1","Jl2","Ag1","Ag2","S1","S2","O1","O2","N1","N2","D1","D2"];
const MC_MONTHS = ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"];
const MC_POS = Object.fromEntries(MC_ORDER.map((k,i)=>[k,i+1]));
const MC_PHASE_COLORS = {
  si: "#5aa9ff",
  se: "#3dd598",
  tr: "#ffcc4d",
  co: "#ff6fae",
};

function mcMixStyle(phases){
  // phases = ["si","tr"] etc.
  const cols = phases.map(p => MC_PHASE_COLORS[p]).filter(Boolean);
  if (cols.length <= 1) return "";
  const n = cols.length;
  const stops = cols.map((c, i) => {
    const a = (i * 100) / n;
    const b = ((i + 1) * 100) / n;
    return `${c} ${a}% ${b}%`;
  }).join(", ");
  return `background:linear-gradient(90deg, ${stops});`;
}
// -------------------- Dates/quinzenes helpers --------------------
function mcTodayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function mcParseIntervals(a,b){
  if(!a || !b) return [];

  const A = String(a).split(";").map(s=>s.trim()).filter(Boolean);
  const B = String(b).split(";").map(s=>s.trim()).filter(Boolean);

  let aList = A, bList = B;
  if(aList.length===1 && bList.length>1) aList = Array(bList.length).fill(aList[0]);
  if(bList.length===1 && aList.length>1) bList = Array(aList.length).fill(bList[0]);

  const FIRST = MC_ORDER[0];                  // G1
  const LAST  = MC_ORDER[MC_ORDER.length-1];  // D2

  const out = [];

  for(let i=0;i<Math.min(aList.length,bList.length);i++){
    const startCode = aList[i];
    const endCode   = bList[i];
    const s = MC_POS[startCode];
    const e = MC_POS[endCode];
    if(!s || !e) continue;

    if (s <= e) {
      out.push([s, e, startCode, endCode]);
    } else {
      // Travessa l'any: split en 2 segments
      out.push([s, 24, startCode, LAST]);   // de start fins D2
      out.push([1, e, FIRST, endCode]);     // de G1 fins end
    }
  }

  return out;
}

function mcSegments(c){
  return {
    SI: mcParseIntervals(c.SI_ini,c.SI_fi),
    SE: mcParseIntervals(c.SE_ini,c.SE_fi),
    TR: mcParseIntervals(c.TR_ini,c.TR_fi),
    CO: mcParseIntervals(c.CO_ini,c.CO_fi)
  };
}

function mcCurrentHalf(val){
  if(val && MC_POS[val]) return MC_POS[val];
  const d = new Date();
  return d.getDate()<=15 ? (d.getMonth()*2+1) : (d.getMonth()*2+2);
}

function mcHalfCodeFromDate(dateStr){
  const d = dateStr ? new Date(dateStr+"T12:00:00") : new Date();
  return d.getDate()<=15 ? MC_ORDER[d.getMonth()*2] : MC_ORDER[d.getMonth()*2+1];
}

function mcHalfText(q){
  if(!q) return "";
  const m = Math.ceil(q/2)-1;
  return `${q%2===1 ? "1a" : "2a"} ${MC_MONTHS[m]}`;
}

function mcCodeToFullLabel(code){
  const months = {
    G:"gener", F:"febrer", "Mç":"març", A:"abril", Mg:"maig", Jn:"juny",
    Jl:"juliol", Ag:"agost", S:"setembre", O:"octubre", N:"novembre", D:"desembre"
  };
  let half = "";
  let monthKey = "";
  if (code.startsWith("Mç")) { monthKey = "Mç"; half = code.slice(2); }
  else if (code.startsWith("Mg")) { monthKey = "Mg"; half = code.slice(2); }
  else if (code.startsWith("Jn")) { monthKey = "Jn"; half = code.slice(2); }
  else if (code.startsWith("Jl")) { monthKey = "Jl"; half = code.slice(2); }
  else if (code.startsWith("Ag")) { monthKey = "Ag"; half = code.slice(2); }
  else { monthKey = code.charAt(0); half = code.slice(1); }

  const halfTxt = half === "1" ? "1a quinzena" : half === "2" ? "2a quinzena" : `${half} quinzena`;
  return `${halfTxt} ${months[monthKey] || code}`;
}

function mcFormatRangeLabel(startCode, endCode){
  return `${mcCodeToFullLabel(startCode)} / ${mcCodeToFullLabel(endCode)}`;
}

function mcCapFirst(s){
  return s ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;
}

// Títol: "2a quinzena Febrer"
function mcHalfTitleLabel(q){
  const code = MC_ORDER[q - 1];
  // "2a quinzena febrer" -> "2a quinzena Febrer"
  return mcCodeToFullLabel(code).replace(/\b([a-zàèéíòóúç]+)\b$/i, (m) => mcCapFirst(m));
}

// -------------------- Etiquetes / Notes --------------------
const MC_DANGER_TAGS = new Set([
  "fred",
  "fred inicial",
  "vent",
  "evitar estiu",
  "espiga amb calor"
]);

function mcFormatTag(tag){
  const t = String(tag || "").trim();
  if (!t) return "";
  if (MC_DANGER_TAGS.has(t.toLowerCase())) return `⛔ ${mcCapFirst(t)}`;
  return t;
}

function mcHumanizeNotes(txt){
  if (!txt) return txt;
  let s = String(txt);

  // Rang "Ag1–Ag2" o "Ag1-Ag2"
  s = s.replace(
    /\b(G1|G2|F1|F2|Mç1|Mç2|A1|A2|Mg1|Mg2|Jn1|Jn2|Jl1|Jl2|Ag1|Ag2|S1|S2|O1|O2|N1|N2|D1|D2)\s*[–-]\s*(G1|G2|F1|F2|Mç1|Mç2|A1|A2|Mg1|Mg2|Jn1|Jn2|Jl1|Jl2|Ag1|Ag2|S1|S2|O1|O2|N1|N2|D1|D2)\b/g,
    (_, a, b) => mcFormatRangeLabel(a, b)
  );

  // Codi sol
  s = s.replace(
    /\b(G1|G2|F1|F2|Mç1|Mç2|A1|A2|Mg1|Mg2|Jn1|Jn2|Jl1|Jl2|Ag1|Ag2|S1|S2|O1|O2|N1|N2|D1|D2)\b/g,
    (code) => mcCodeToFullLabel(code)
  );

  // Terminologia
  s = s.replace(/\bmulch\b/gi, "encoixinat");
  s = s.replace(/\bmulching\b/gi, "encoixinat");
  return s;
}

// -------------------- Lògica de calendari --------------------
function mcInRange(q, ranges){
  return ranges.some(([s,e]) => q>=s && q<=e);
}

function mcMatchesPhase(c, phase){
  return !phase || mcSegments(c)[phase]?.length>0;
}

function mcMatchesHalf(c, q){
  const s = mcSegments(c);
  return ["SI","SE","TR","CO"].some(ph => mcInRange(q, s[ph]));
}

function mcNowInfo(c, q){
  const s = mcSegments(c);
  const active = [];
  if (mcInRange(q, s.SI)) active.push("sembra interior");
  if (mcInRange(q, s.SE)) active.push("sembra exterior / plantació");
  if (mcInRange(q, s.TR)) active.push("trasplantament");
  if (mcInRange(q, s.CO)) active.push("collita");

  if (active.length){
    return { status:"now", title:"Ara toca: " + active.join(" + "), hint:`Quinzena actual: ${mcHalfText(q)}.` };
  }

  const starts = [];
  [
    ["sembra interior", s.SI],
    ["sembra exterior / plantació", s.SE],
    ["trasplantament", s.TR],
    ["collita", s.CO],
  ].forEach(([t, rs]) => rs.forEach(r => { if (r[0] >= q) starts.push({ t, q: r[0] }); }));

  starts.sort((a,b)=>a.q-b.q);

  if (starts.length){
    return { status:"soon", title:`Ara no toca. El següent és: ${starts[0].t}`, hint:`Previst per a ${mcHalfText(starts[0].q)}.` };
  }
  return { status:"off", title:"Ara no toca", hint:"El següent període correspon a la temporada següent." };
}

// Calendari resumit: label amb swatch de color com la llegenda
function mcRangePills(label, ranges, cls){
  if(!ranges.length) return "";
  return `
    <div class="mc-line">
      <div class="mc-line__label">
        <span class="swatch swatch--${cls}"></span>
        <span>${label}</span>
      </div>
      <div class="mc-line__value">
        ${ranges.map(r => `<span class="mc-pill mc-pill--${cls}">${mcFormatRangeLabel(r[2], r[3])}</span>`).join(" ")}
      </div>
    </div>
  `;
}

function mcDisplayRows(c){
  const s = mcSegments(c);
  const direct = !s.SI.length && !s.TR.length && s.SE.length; // sembra directa sense planter/trasplant
  let out = "";

  if (direct){
    out += mcRangePills("Sembra / plantació", s.SE, "se");
  } else {
    out += mcRangePills("Sembra interior", s.SI, "si");
    out += mcRangePills("Sembra ext. / plantació", s.SE, "se");
    out += mcRangePills("Trasplantament", s.TR, "tr");
  }

  out += mcRangePills("Collita", s.CO, "co");

  if (!out){
    out = `<div class="mc-line"><div class="mc-line__label"></div><div class="mc-line__value">—</div></div>`;
  }
  return out;
}

function mcMiniBar(c, qCurrent){
  const s = mcSegments(c);
  const months = MC_MONTHS.map(m=>`<div>${m}</div>`).join("");
  let bars = "";

  for (let q = 1; q <= 24; q++) {
  const active = [];
  if (mcInRange(q, s.SI)) active.push("si");
  if (mcInRange(q, s.SE)) active.push("se");
  if (mcInRange(q, s.TR)) active.push("tr");
  if (mcInRange(q, s.CO)) active.push("co");

  let cls = "q";
  let style = "";

  if (active.length === 1) {
    cls += " " + active[0];
  } else if (active.length > 1) {
    style = ` style="${mcMixStyle(active)}"`;
  }

  if (q === qCurrent) cls += " current";

  bars += `<div class="${cls}"${style} title="${MC_ORDER[q-1]}"></div>`;
}

  return `<div class="mini"><div class="months">${months}</div><div class="bargrid">${bars}</div></div>`;
}

function mcSort(items, qCurrent){
  return items.sort((a,b)=>{
    const rank = (x) => {
      const st = mcNowInfo(x, qCurrent).status;
      return st==="now" ? 0 : st==="soon" ? 1 : 2;
    };
    const ra = rank(a), rb = rank(b);
    if(ra!==rb) return ra-rb;
    return a.cultiu.localeCompare(b.cultiu,"ca");
  });
}

// -------------------- UI init/render --------------------
function initCalendari(){
  const qEl = document.getElementById("mcQ");
  if(!qEl) return;

  const familyEl = document.getElementById("mcFamily");
  const tagEl = document.getElementById("mcTag");
  const phaseEl = document.getElementById("mcPhase");
  const halfEl = document.getElementById("mcHalf");
  const clearEl = document.getElementById("mcClear");
  const toggleNotesEl = document.getElementById("mcToggleNotes");

  const statsEl = document.getElementById("mcStats");         // queda buit (o ocult per CSS)
  const cardsEl = document.getElementById("mcViewCards");
  const familiesEl = document.getElementById("mcViewFamilies");
  const tableEl = document.getElementById("mcViewTable");
  const ganttEl = document.getElementById("mcViewGantt");
  const mobileEl = document.getElementById("mcViewMobile");

  const metaPillsEl = document.getElementById("mcMetaPills"); // no s'usa (ocult per CSS)
  const legendTagsEl = document.getElementById("mcLegendTags");// no s'usa (ocult per CSS)

  // h1: recomanat posar-li id="mcTitle" a calendari.html, però també el trobem per selector
  const titleEl = document.getElementById("mcTitle") || document.querySelector(".hero-calendari__main h1");

  const families = [...new Set(MC_DATA.map(x=>x.familia))].sort((a,b)=>a.localeCompare(b,"ca"));
  const tags = [...new Set(MC_DATA.flatMap(x=>x.etiquetes))].sort((a,b)=>a.localeCompare(b,"ca"));

  familyEl.innerHTML = '<option value="">Totes</option>' + families.map(f=>`<option value="${f}">${f}</option>`).join("");
  tagEl.innerHTML = '<option value="">Totes</option>' + tags.map(t=>`<option value="${t}">${t}</option>`).join("");
  phaseEl.innerHTML =
    '<option value="">Totes</option>' +
    '<option value="SI">Sembra interior</option>' +
    '<option value="SE">Sembra exterior / plantació</option>' +
    '<option value="TR">Trasplantament</option>' +
    '<option value="CO">Collita</option>';

  halfEl.innerHTML =
    '<option value="">Actual</option>' +
    MC_ORDER.map(k=>`<option value="${k}">${mcCodeToFullLabel(k)}</option>`).join("");

  if (metaPillsEl) metaPillsEl.innerHTML = "";
  if (legendTagsEl) legendTagsEl.innerHTML = "";

  let showNotes = true;

  function filtered(){
    const qText = qEl.value.trim().toLowerCase();
    const family = familyEl.value;
    const tag = tagEl.value;
    const phase = phaseEl.value;

    const halfCode = halfEl.value || mcHalfCodeFromDate(mcTodayISO());
    const qCurrent = mcCurrentHalf(halfCode);

    const items = MC_DATA.filter(c=>{
      const hay = (c.cultiu+" "+c.familia+" "+c.tipus+" "+c.notes+" "+c.etiquetes.join(" ")).toLowerCase();
      return (!qText || hay.includes(qText)) &&
        (!family || c.familia===family) &&
        (!tag || c.etiquetes.includes(tag)) &&
        (!phase || mcMatchesPhase(c, phase)) &&
        (!halfEl.value || mcMatchesHalf(c, qCurrent));
    });

    return { items: mcSort(items, qCurrent), qCurrent };
  }

  // Stats eliminades
  function renderStats(){
    if (statsEl) statsEl.innerHTML = "";
  }

  function renderCardsView(items, qCurrent, host){
    host.innerHTML = items.map(c=>{
      const now = mcNowInfo(c, qCurrent);
      return `
        <article class="card mc-card">
          <div class="mc-card__head is-${now.status}">
            <div class="mc-card__top">
              <div>
                <h3>${c.cultiu}</h3>
                <p class="mc-sub">${c.familia} · ${c.tipus}</p>
              </div>
              <span class="mc-badge">${c.tipus}</span>
            </div>

            <div class="mc-nowbox">
              <div class="mc-nowtext">${now.title}</div>
            </div>

            <div class="mc-tags">
              ${c.etiquetes.map(t=>`<span class="legend-chip legend-chip--tag">${mcFormatTag(t)}</span>`).join("")}
            </div>
          </div>

          <div class="mc-card__body">
            <div class="mc-section-title">Calendari resumit</div>
            <div class="mc-lines">${mcDisplayRows(c)}</div>
            ${mcMiniBar(c, qCurrent)}
            ${showNotes ? `
              <details class="mc-details">
                <summary>Veure detalls</summary>
                <div class="mc-notes">${mcHumanizeNotes(c.notes)}</div>
              </details>
            ` : ""}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderFamilies(items, qCurrent){
    const groups = items.reduce((acc,x)=>((acc[x.familia]??=[]).push(x), acc), {});
    familiesEl.innerHTML = Object.entries(groups).map(([fam, rows])=>`
      <article class="card family-block">
        <div class="family-block__head">
          <h3>${fam}</h3>
          <span>${rows.length} cultius</span>
        </div>
        <div class="family-block__grid">
          ${rows.map(c=>`
            <button class="family-mini" type="button">
              <strong>${c.cultiu}</strong>
              <span>${mcNowInfo(c, qCurrent).title.replace("Ara toca: ","")}</span>
            </button>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderTable(items){
    tableEl.innerHTML = `
      <div class="table-wrap">
        <table class="mc-table">
          <thead>
            <tr>
              <th>Cultiu</th>
              <th>Família</th>
              <th>Sembra / plantació</th>
              <th>Trasplantament</th>
              <th>Collita</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(c=>{
              const s = mcSegments(c);
              const direct = !s.SI.length && !s.TR.length && s.SE.length;
              const sem = direct ? s.SE : (s.SI.length ? s.SI : s.SE);
              return `
                <tr>
                  <td><strong>${c.cultiu}</strong></td>
                  <td>${c.familia}</td>
                  <td>${sem.length ? sem.map(r=>mcFormatRangeLabel(r[2], r[3])).join(" · ") : "—"}</td>
                  <td>${s.TR.length ? s.TR.map(r=>mcFormatRangeLabel(r[2], r[3])).join(" · ") : "—"}</td>
                  <td>${s.CO.length ? s.CO.map(r=>mcFormatRangeLabel(r[2], r[3])).join(" · ") : "—"}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderGantt(items, qCurrent){
    ganttEl.innerHTML = items.map(c=>{
      const s = mcSegments(c);
      let cells = "";
      for(let q=1;q<=24;q++){
        const active = [];
        if(mcInRange(q, s.SI)) active.push("si");
        if(mcInRange(q, s.SE)) active.push("se");
        if(mcInRange(q, s.TR)) active.push("tr");
        if(mcInRange(q, s.CO)) active.push("co");
        let cls = "gq";
let style = "";

if (active.length === 1) {
  cls += " " + active[0];
} else if (active.length > 1) {
  style = ` style="${mcMixStyle(active)}"`;
}

if (q === qCurrent) cls += " current";

cells += `<span class="${cls}"${style} title="${MC_ORDER[q-1]}"></span>`;
      }
      return `
        <div class="gantt-row">
          <div class="gantt-name">${c.cultiu}</div>
          <div class="gantt-grid">${cells}</div>
        </div>
      `;
    }).join("");
  }

  function renderAll(){
    const { items, qCurrent } = filtered();

    // Títol amb quinzena
    if (titleEl){
      titleEl.textContent = `Calendari de cultius de l'Alt Camp - ${mcHalfTitleLabel(qCurrent)}`;
    }

    renderStats();
    renderCardsView(items, qCurrent, cardsEl);
    renderFamilies(items, qCurrent);
    renderTable(items);
    renderGantt(items, qCurrent);
    renderCardsView(items, qCurrent, mobileEl);
  }

  // Events
  [qEl, familyEl, tagEl, phaseEl, halfEl].forEach(el => el.addEventListener("input", renderAll));
  [familyEl, tagEl, phaseEl, halfEl].forEach(el => el.addEventListener("change", renderAll));

  clearEl.addEventListener("click", ()=>{
    qEl.value = "";
    familyEl.value = "";
    tagEl.value = "";
    phaseEl.value = "";
    halfEl.value = "";
    renderAll();
  });

  toggleNotesEl.addEventListener("click", ()=>{
    showNotes = !showNotes;
    toggleNotesEl.textContent = showNotes ? "Amaga notes" : "Mostra notes";
    renderAll();
  });

  document.querySelectorAll("[data-mc-view-btn]").forEach(btn => btn.addEventListener("click", ()=>{
    document.querySelectorAll("[data-mc-view-btn]").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".mc-view").forEach(v=>v.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.mcViewBtn;
    document.getElementById("mcView"+view.charAt(0).toUpperCase()+view.slice(1)).classList.add("active");
  }));

  renderAll();
}

if (document.body?.dataset?.page === "calendari"){
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCalendari);
  else initCalendari();
}
