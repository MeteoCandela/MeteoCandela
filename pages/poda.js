{
  "location": "Alt Camp (Valls)",
  "months": ["Gen","Feb","Mar","Abr","Mai","Jun","Jul","Ago","Set","Oct","Nov","Des"],
  "legend": {
    "winter_structural": "Poda d’hivern (estructura/sanitària)",
    "green_summer": "Poda en verd / estiu (control/aireig)",
    "post_bloom": "Després de florir (ornamentals)",
    "touchup": "Retocs estètics"
  },
  "plants": [
    {
      "id": "olive",
      "name": "Olivera",
      "type": "fruit_mediterrani",
      "windows": {
        "winter_structural": [0,1,1,1,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,0,0,0,0,0,0],
        "touchup":          [0,0,0,0,0,0,0,0,1,1,0,0]
      },
      "notes": [
        "Poda principal: finals d’hivern i inici de primavera, evitant gelades i dies molt humits.",
        "A l’estiu: només xupons i aireig suau per evitar cremades."
      ]
    },
    {
      "id": "vine",
      "name": "Vinya",
      "type": "fruit_mediterrani",
      "windows": {
        "winter_structural": [1,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,1,1,1,0,0,0]
      },
      "notes": [
        "Poda d’hivern (poda seca): habitualment gen–mar; en anys freds, millor avançar poc i evitar dies de gel.",
        "Poda en verd: de maig a setembre (despuntat, aclarida, control de vigor)."
      ]
    },
    {
      "id": "almond",
      "name": "Ametller",
      "type": "fruiter_os",
      "windows": {
        "winter_structural": [0,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,0,0,0,0,0,0]
      },
      "notes": [
        "Millor feb–mar a l’Alt Camp (menys risc de gelada que al gener).",
        "En verd: xupons i aireig moderat."
      ]
    },
    {
      "id": "hazelnut",
      "name": "Avellaner",
      "type": "fruiter_arbustiu",
      "windows": {
        "winter_structural": [0,1,1,1,0,0,0,0,0,0,0,0],
        "touchup":          [0,0,0,0,0,0,0,0,1,0,0,0]
      },
      "notes": [
        "Poda de renovació i aclarida de tanys: finals d’hivern–primavera.",
        "Retoc suau postestiu si hi ha excés de vigor."
      ]
    },
    {
      "id": "apple_pear",
      "name": "Pomera / Perera",
      "type": "fruiter_llavor",
      "windows": {
        "winter_structural": [1,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,1,0,0,0,0,0]
      },
      "notes": [
        "Poda d’hivern gen–mar (a l’Alt Camp sovint feb–mar és el punt òptim).",
        "En verd: maig–juliol per aireig i control de vigor."
      ]
    },
    {
      "id": "stone_fruit",
      "name": "Cirerer / Prunera / Presseguer",
      "type": "fruiter_os",
      "windows": {
        "winter_structural": [0,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,0,1,1,1,1,0,0,0]
      },
      "notes": [
        "Evita poda forta al gener si hi ha risc de gelades.",
        "Postcollita (estiu–setembre): podes lleugeres i aireig."
      ]
    },
    {
      "id": "citrus",
      "name": "Cítrics (llimoner/taronger)",
      "type": "fruiter_perenne",
      "windows": {
        "winter_structural": [0,0,1,1,0,0,0,0,0,0,0,0],
        "touchup":          [0,0,0,0,1,1,0,0,0,0,0,0]
      },
      "notes": [
        "A l’Alt Camp, millor mar–abr (evitant fred tardà).",
        "Retocs suaus després de brotació."
      ]
    },
    {
      "id": "roses",
      "name": "Rosers",
      "type": "ornamental",
      "windows": {
        "winter_structural": [0,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,1,1,1,0,0,0],
        "touchup":          [0,0,0,0,1,1,1,1,1,1,0,0]
      },
      "notes": [
        "Poda principal: feb–mar.",
        "Durant la temporada: despuntar i retirar flors passades."
      ]
    },
    {
      "id": "hydrangea",
      "name": "Hortènsies",
      "type": "ornamental",
      "windows": {
        "winter_structural": [0,1,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,0,0,1,1,1,0,0,0]
      },
      "notes": [
        "Poda segons varietat (floració sobre fusta vella vs nova). Com a norma: feb–mar sanejant i aclarint.",
        "A l’estiu: retirar inflorescències passades i retocs suaus."
      ]
    },
    {
      "id": "hedges",
      "name": "Bardisses (xiprer/photinia/llorer)",
      "type": "bardissa",
      "windows": {
        "winter_structural": [0,0,1,0,0,0,0,0,0,0,0,0],
        "green_summer":     [0,0,0,0,1,1,0,0,0,0,0,0],
        "touchup":          [0,0,0,0,0,0,0,0,1,1,0,0]
      },
      "notes": [
        "Retall principal: març (quan baixa el risc de gelada).",
        "Retocs: maig–juny i un últim retoc set–oct."
      ]
    }
  ]
}
