export interface TchalaItem {
  id: string;
  mot: string;
  motFr: string;
  numeros: string[];
  emoji: string;
  categorie: string;
  signification: string;
}

export const TCHALA_ITEMS: TchalaItem[] = [
  {
    id: '1',
    mot: 'Dlo',
    motFr: 'Eau / Fleuve',
    numeros: ['14', '41'],
    emoji: '💧',
    categorie: 'Lanati & Eleman',
    signification: 'Rèv dlo klè anonse gwo lajan ak benediksyon k ap desann sou ou.'
  },
  {
    id: '2',
    mot: 'Lajan',
    motFr: 'Argent / Billets',
    numeros: ['50', '05', '100'],
    emoji: '💰',
    categorie: 'Prosperite & Richès',
    signification: 'Ou wè lajan oswa pyès monnen, se yon gwo maryaj oswa loto 3 chif.'
  },
  {
    id: '3',
    mot: 'Chen',
    motFr: 'Chien',
    numeros: ['25', '52'],
    emoji: '🐕',
    categorie: 'Bèt',
    signification: 'Chen ki jape oswa k ap kouri dèyè w anonse lwayote ak pwoteksyon.'
  },
  {
    id: '4',
    mot: 'Kouto',
    motFr: 'Couteau / Arme',
    numeros: ['18', '81'],
    emoji: '🔪',
    categorie: 'Objè',
    signification: 'Koupe blese oswa batay, kenbe 18 nan tiraj New York Soir.'
  },
  {
    id: '5',
    mot: 'Machin',
    motFr: 'Voiture / Véhicule',
    numeros: ['44', '04'],
    emoji: '🚗',
    categorie: 'Transpò',
    signification: 'Woule nan bèl machin, vwayaj rapid ak siksè nan biznis.'
  },
  {
    id: '6',
    mot: 'Manman',
    motFr: 'Mère / Maman',
    numeros: ['08', '80'],
    emoji: '🤱',
    categorie: 'Fanmi',
    signification: 'Manman w ki parèt nan rèv se yon zanj gadyen, jwe 08 an fòs.'
  },
  {
    id: '7',
    mot: 'Fanm',
    motFr: 'Femme / Demoiselle',
    numeros: ['04', '40'],
    emoji: '💃',
    categorie: 'Moun',
    signification: 'Bèl fanm oswa rankont amoure, maryaj asire sou Florida.'
  },
  {
    id: '8',
    mot: 'Dan',
    motFr: 'Dents / Mâchoire',
    numeros: ['09', '90'],
    emoji: '🦷',
    categorie: 'Kò Moun',
    signification: 'Dan ki tonbe oswa k ap fè mal, yon nouvèl enpòtan sou wout.'
  },
  {
    id: '9',
    mot: 'Kay',
    motFr: 'Maison / Édifice',
    numeros: ['12', '21'],
    emoji: '🏠',
    categorie: 'Batiman',
    signification: 'Konstriksyon kay oswa nouvo lojman, estabilite ak gwo genyen.'
  },
  {
    id: '10',
    mot: 'Pwason',
    motFr: 'Poisson / Mer',
    numeros: ['32', '23'],
    emoji: '🐟',
    categorie: 'Lanati',
    signification: 'Gwo pwason nan dlo se abondans ak chans nan tout jwèt.'
  },
  {
    id: '11',
    mot: 'Difé',
    motFr: 'Feu / Flamme',
    numeros: ['01', '10'],
    emoji: '🔥',
    categorie: 'Eleman',
    signification: 'Flanm dife ki limen se kote ki cho, mete sou 1er lot.'
  },
  {
    id: '12',
    mot: 'Lanmò',
    motFr: 'Mort / Enterrement',
    numeros: ['77', '70'],
    emoji: '⚰️',
    categorie: 'Mistè',
    signification: 'Sèkèy oswa antèman, paradoksalman anonse yon gwo chans k ap vini.'
  },
  {
    id: '13',
    mot: 'Mariyaj',
    motFr: 'Mariage / Noces',
    numeros: ['22', '20'],
    emoji: '💍',
    categorie: 'Seremoni',
    signification: 'Gwo maryaj selebre, jwe maryaj gratis 22 × 14 oswa 22 × 50.'
  },
  {
    id: '14',
    mot: 'Pitit / Ti Bebe',
    motFr: 'Enfant / Bébé',
    numeros: ['03', '30'],
    emoji: '👶',
    categorie: 'Fanmi',
    signification: 'Tibebe ki fenk fèt oswa timoun k ap ri se inosans ak kado.'
  },
  {
    id: '15',
    mot: 'Vòlè',
    motFr: 'Voleur / Bandit',
    numeros: ['55', '35'],
    emoji: '🥷',
    categorie: 'Moun',
    signification: 'Vòlè ki chape oswa k ap rantre, veye lajan w epi jwe 55.'
  },
  {
    id: '16',
    mot: 'Avyon',
    motFr: 'Avion / Ciel',
    numeros: ['99', '19'],
    emoji: '✈️',
    categorie: 'Transpò',
    signification: 'Avyon k ap monte nan syèl, siksè wo nivo ak gwo miltiplikatè.'
  },
  {
    id: '17',
    mot: 'San',
    motFr: 'Sang / Blessure',
    numeros: ['10', '01'],
    emoji: '🩸',
    categorie: 'Kò Moun',
    signification: 'San ki koule, lavi ak kouraj, nimewo kle nan tiraj Midi.'
  },
  {
    id: '18',
    mot: 'Pye / Soulye',
    motFr: 'Pieds / Chaussures',
    numeros: ['02', '20'],
    emoji: '👞',
    categorie: 'Kò & Rad',
    signification: 'Mache byen lwen oswa mete soulye nèf, vwayaj ki louvri pòt.'
  },
  {
    id: '19',
    mot: 'Chat',
    motFr: 'Chat',
    numeros: ['13', '31'],
    emoji: '🐈',
    categorie: 'Bèt',
    signification: 'Chat nwa oswa chat k ap miaw, entwisyon ak sekrè k ap revele.'
  },
  {
    id: '20',
    mot: 'Zwazo',
    motFr: 'Oiseau / Plumes',
    numeros: ['17', '71'],
    emoji: '🕊️',
    categorie: 'Bèt',
    signification: 'Zwazo k ap chante sou yon branch, bon nouvèl sou wout.'
  },
  {
    id: '21',
    mot: 'Lapolis',
    motFr: 'Police / Gendarme',
    numeros: ['75', '57'],
    emoji: '👮',
    categorie: 'Moun',
    signification: 'Inifòm lapolis oswa sirèn, lòd ak jistis pral fèt.'
  },
  {
    id: '22',
    mot: 'Chwal',
    motFr: 'Cheval / Course',
    numeros: ['15', '51'],
    emoji: '🐎',
    categorie: 'Bèt',
    signification: 'Chwal k ap galope rapid, viktwa rapid sou tiraj Florida.'
  },
  {
    id: '23',
    mot: 'Koulèv',
    motFr: 'Serpent / Vipère',
    numeros: ['33', '88'],
    emoji: '🐍',
    categorie: 'Bèt',
    signification: 'Koulèv k ap trennen, mistè, enèji kache ak sajès.'
  },
  {
    id: '24',
    mot: 'Legliz / Pè',
    motFr: 'Église / Prêtre',
    numeros: ['07', '70'],
    emoji: '⛪',
    categorie: 'Spirityèl',
    signification: 'Lapriyè nan legliz, benediksyon ak limyè divin sou fòtin ou.'
  },
  {
    id: '25',
    mot: 'Bwè Tafya / Fèt',
    motFr: 'Alcool / Boisson / Fête',
    numeros: ['69', '96'],
    emoji: '🍾',
    categorie: 'Amizman',
    signification: 'Gwo anbyans ak mizik, selebre yon gwo viktwa k ap vini.'
  },
  {
    id: '26',
    mot: 'Solèy',
    motFr: 'Soleil / Chaleur',
    numeros: ['00', '11'],
    emoji: '☀️',
    categorie: 'Lanati',
    signification: 'Solèy cho k ap klere, limyè klè sou tout pwojè w yo.'
  },
  {
    id: '27',
    mot: 'Lalin',
    motFr: 'Lune / Nuit',
    numeros: ['06', '60'],
    emoji: '🌙',
    categorie: 'Lanati',
    signification: 'Lalin plen nan nwit, tiraj New York Soir favorize.'
  },
  {
    id: '28',
    mot: 'Papye / Lèt',
    motFr: 'Lettre / Document',
    numeros: ['45', '54'],
    emoji: '✉️',
    categorie: 'Objè',
    signification: 'Lèt postal oswa dokiman viza, siyati enpòtan.'
  },
  {
    id: '29',
    mot: 'Telefòn',
    motFr: 'Téléphone / Appel',
    numeros: ['66', '99'],
    emoji: '📱',
    categorie: 'Objè',
    signification: 'Kout fil inatandi k ap pote bon nouvèl lajan.'
  },
  {
    id: '30',
    mot: 'Lapli / Loraj',
    motFr: 'Pluie / Tonnerre',
    numeros: ['28', '82'],
    emoji: '⛈️',
    categorie: 'Lanati',
    signification: 'Gwo lapli k ap tonbe, lave tout move chans pou louvri chemen.'
  }
];
