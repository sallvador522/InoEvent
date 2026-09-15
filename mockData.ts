export enum ThemeType {
  WEDDING = "WEDDING",
  BIRTHDAY = "BIRTHDAY",
  CORPORATE = "CORPORATE",
  BRIDAL_SHOWER = "BRIDAL_SHOWER",
  BABY_SHOWER = "BABY_SHOWER",
}

export interface EventDetails {
  id: string;
  type: ThemeType;
  layoutMode: string;
  title: string;
  hosts: string;
  brideParents?: string;
  groomParents?: string;
  brideName?: string;
  groomName?: string;
  date: string;
  isoDate: string;
  time: string;
  locationName: string;
  address: string;
  receptionName?: string;
  receptionAddress?: string;
  mapLink?: string;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  formattedAddress?: string | null;
  plusCode?: string | null;
  rating?: number | null;
  userRatingsTotal?: number | null;
  mapsUrl?: string | null;
  placePhotoUrl?: string | null;
  locationSource?: 'google' | 'osm' | 'gps' | 'link' | 'mapa' | null;
  locationUpdatedAt?: string | null;
  heroImage: string;
  description: string;
  musicTrack?: string;
  themeColor: string;
  mapImage?: string;
  gallery?: string[];
  timeline: { time: string; title: string; description: string }[];
  dressCode?: { title: string; description: string; image?: string };
  gifts?: {
    type: string;
    title: string;
    description: string;
    value: string;
    bankName?: string;
    accountName?: string;
  }[];
  brideQuote?: string;
  groomQuote?: string;
  coupleTitle?: string;
  footerMessage?: string;
  welcomeMessage?: string;
}

// We will inject the events array here

export const EVENTS: EventDetails[] = [
  {
    id: "chany-pedro-wedding",
    type: ThemeType.WEDDING,
    layoutMode: "LIMINTSO_GOLD",
    title: "Chany & Pedro",
    hosts: "O Casamento de",
    brideName: "Chany Huó",
    groomName: "Pedro Palate Jr",
    brideParents: "Ilda Dique e Jorge Dique",
    groomParents: "Angélica Palate e Pedro Palate",
    date: "09 de Agosto de 2025",
    isoDate: "2025-08-09T12:00:00",
    time: "12:00",
    locationName: "Complexo Lookal",
    address: "Ilha de Luanda, Luanda, Angola",
    receptionName: "Copo d'água",
    receptionAddress: "Lookal Ocean Club, Ilha de Luanda",
    mapLink: "https://maps.google.com/?q=Lookal+Ocean+Club+Luanda",
    heroImage: "/chany-pedro-preview.webp",
    description:
      "Temos a honra de convidá-lo(a) a comemorar esta data especial connosco. Venha juntar-se a nós e ajudar-nos a celebrar o nosso enlace matrimonial de acordo com a agenda abaixo:",
    musicTrack: "TEEKS - First Time",
    themeColor: "#dcb349",
    gallery: [
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2574&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "12:00",
        title: "Cerimónia Civil",
        description: "Complexo Lookal, Luanda",
      },
      {
        time: "13:00",
        title: "Cerimónia Religiosa",
        description: "Complexo Lookal, Luanda",
      },
      {
        time: "14:30",
        title: "Copo d'água",
        description: "Lookal Ocean Club, Luanda",
      },
    ],
    dressCode: {
      title: "Formal / Esporte Fino",
      description:
        "Sugerimos trajes finos formais para celebrar connosco em grande elegância.",
      image:
        "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
    },
    gifts: [
      {
        type: "IBAN",
        title: "Presentes em Dinheiro",
        description:
          "Sua presença é o nosso maior presente! Se desejar nos presentear, sinta-se à vontade:",
        value: "AO06 0000 0000 0000 0000 0000 0",
        bankName: "BAI",
        accountName: "Chany & Pedro",
      },
    ],
  },
  {
    id: "marnela-evandro-wedding",
    type: ThemeType.WEDDING,
    layoutMode: "LIMINTSO_ME",
    title: "Marnela & Evandro",
    hosts: "A UNIÃO MATRIMONIAL DE",
    brideName: "Marnela Zunguze",
    groomName: "Evandro Jojó",
    brideParents: `Jorge Senete Zunguze
e
Alia Alexandre Gueze`,
    groomParents: `José João Jojó
e
Anacanizia Lopes Lima`,
    date: "Sábado, 11 de Outubro de 2025",
    isoDate: "2025-10-11T11:00:00",
    time: "11:00",
    locationName: "Salão Noblesse Talatona",
    address: "Via AL14, Talatona, Luanda, Angola",
    receptionName: "Copo d'água",
    receptionAddress: "Salão Noblesse, Talatona, Luanda",
    mapLink: "https://maps.google.com/?q=Talatona+Luanda",
    heroImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop",
    description: `I Coríntios 13: 4-7
Aqui começa o nosso lar, erguido sobre a fé e o amor de Deus.
Cada passo que damos é promessa de que ele será sempre o alicerce da nossa Família.`,
    musicTrack: "TEEKS - First Time",
    themeColor: "#E9BE5D",
    mapImage: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=1200&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "11:00",
        title: "Cerimónia Civil",
        description: "Salão Noblesse, Talatona",
      },
      {
        time: "12:00",
        title: "Cerimónia Religiosa",
        description: "Salão Noblesse, Talatona",
      },
      {
        time: "14:00",
        title: "Copo d'água",
        description: "Salão Noblesse, Talatona",
      },
    ],
    dressCode: {
      title: "Formal / Passeio Completo",
      description:
        "Sugerimos trajes finos formais para celebrar connosco em grande elegância.",
      image:
        "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
    },
    gifts: [
      {
        type: "IBAN",
        title: "Presentes em Dinheiro",
        description:
          "Sua presença é o nosso maior presente! Se desejar nos presentear, sinta-se à vontade:",
        value: "AO06 0000 0000 0000 0000 0000 0",
        bankName: "BAI",
        accountName: "Marnela & Evandro",
      },
    ],
    brideQuote:
      "Desde que os meus olhos encontram os seus, a taquicardia tomou conta de mim, era a promessa de Deus se cumprindo. O nosso amor será até após a vinda do Senhor.",
    groomQuote:
      "Quando você apareceu no meu caminho, você era a luz que eu precisava para ver as coisas boas ao meu redor. Prometo te amar para sempre e te fazer feliz a cada segundo da sua vida.",
    coupleTitle: "Ó meu Amor,",
    footerMessage: "Estamos ansiosos para celebrar este dia especial com você!",
    welcomeMessage: "Bem-vindo/a",
  },
  {
    id: "wedding-essential",
    type: ThemeType.WEDDING,
    layoutMode: "CLASSIC",
    title: "Ana & João",
    hosts: "Com muita alegria",
    date: "10 . DEZ . 2024",
    isoDate: "2024-12-10T18:00:00",
    time: "18:00",
    locationName: "Espaço Elegance",
    address: "Talatona, Luanda",
    heroImage: "https://images.unsplash.com/photo-1519225421980-715cb02151ff?q=80&w=2670&auto=format&fit=crop",
    description:
      "Um dia inesquecível de celebração do nosso amor. Junte-se a nós para brindarmos à vida e à felicidade (Modelo Essencial).",
    musicTrack: "A Thousand Years - Christina Perri",
    themeColor: "#4A4A4A",
    gallery: [
      "https://images.unsplash.com/photo-1519225421980-715cb02151ff?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522413452208-996901845bb0?q=80&w=2670&auto=format&fit=crop"
    ],
    timeline: [
      { time: "18:00", title: "Cerimônia", description: "Jardim" },
      { time: "20:00", title: "Recepção", description: "Salão Principal" },
    ],
  },
  {
    id: "wedding-ethereal",
    type: ThemeType.WEDDING,
    layoutMode: "MODERN",
    title: "Camila & Tiago",
    hosts: "Convidam para o seu casamento",
    brideParents: "Sílvia e Antônio",
    groomParents: "Teresa e José",
    date: "14 . SET . 2025",
    isoDate: "2025-09-14T16:00:00",
    time: "16:00",
    locationName: "Solar dos Hibiscos",
    address: "Mussulo, Luanda, Angola",
    heroImage: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2574&auto=format&fit=crop",
    description:
      '"O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha." (1 Coríntios 13:4). Sua presença é essencial neste novo capítulo de nossas vidas.',
    musicTrack: "Turning Page - Sleeping At Last",
    themeColor: "#C2B280",
    mapImage:
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=2670&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2670&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "16:00",
        title: "Cerimônia ao Ar Livre",
        description: "Gramado Principal",
      },
      {
        time: "17:30",
        title: "Golden Hour",
        description: "Sessão de Fotos & Coquetel",
      },
      {
        time: "19:00",
        title: "Jantar Intimista",
        description: "Salão de Vidro",
      },
      { time: "21:00", title: "Festa", description: "Pista de Dança" },
    ],
    dressCode: {
      title: "Esporte Fino",
      description:
        "Sugerimos tons claros e tecidos leves. O conforto é primordial.",
      image:
        "https://images.unsplash.com/photo-1490427712608-588e68359dbd?q=80&w=2670&auto=format&fit=crop",
    },
    gifts: [
      {
        type: "IBAN",
        title: "Lua de Mel",
        description:
          "Se desejar nos presentear, contribua para nossa viagem dos sonhos:",
        value: "AO06 0055 0000 9999 8888 7777 6",
      },
    ],
  },
  {
    id: "wedding-garden",
    type: ThemeType.WEDDING,
    layoutMode: "GARDEN",
    title: "Mariana & Ricardo",
    hosts: "Convidam para celebrar",
    brideParents: `Tatiana Aguiar Sousa
Antônio José Vasconcelos`,
    groomParents: `Maria Teresa da Silva
Fernando Rafael Menezes`,
    date: "02 . FEV . 2025",
    isoDate: "2025-02-02T16:30:00",
    time: "16:30",
    locationName: "Quinta das Palmeiras",
    address: "Talatona, Luanda, Angola",
    heroImage:
      "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=2574&auto=format&fit=crop",
    description:
      '"O amor é paciente, o amor é bondoso. Tudo sofre, tudo crê, tudo espera, tudo suporta." (1 Coríntios 13:4-7). Sua presença tornará nosso sonho ainda mais perfeito.',
    musicTrack: "La Vie En Rose - Instrumental",
    themeColor: "#78866B",
    mapImage:
      "https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?q=80&w=2631&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "16:30",
        title: "Cerimônia no Jardim",
        description: "Sob o Gazebo",
      },
      {
        time: "18:00",
        title: "Fotos & Brindes",
        description: "Jardim das Rosas",
      },
      {
        time: "19:30",
        title: "Jantar à Luz de Velas",
        description: "Tenda Cristal",
      },
      { time: "22:00", title: "Banda ao Vivo", description: "Pista de Dança" },
    ],
    gifts: [
      {
        type: "IBAN",
        title: "Presentes em Dinheiro",
        description:
          "Agradecemos por celebrar este momento conosco. Qualquer contribuição será recebida com muito amor:",
        value: "AO06 0000 0000 0000 0000 0000 0",
        bankName: "BAI",
        accountName: "Eduardo e Laura",
      },
    ],
    dressCode: {
      title: "Passeio Completo",
      description: "Tons pastéis e tecidos leves são bem-vindos. Evite branco.",
      image:
        "https://images.unsplash.com/photo-1502035618526-6b2f1f5bca1b?q=80&w=2576&auto=format&fit=crop",
    },
  },
  {
    id: "wedding-royal",
    type: ThemeType.WEDDING,
    layoutMode: "LUXURY",
    title: "Sofia & Eduardo",
    hosts: "Sr. e Sra. Albuquerque convidam",
    brideParents: "Eleonor e Augusto Albuquerque",
    groomParents: "Isabel e Carlos Eduardo Sampaio",
    date: "15 . NOV . 2025",
    isoDate: "2025-11-15T19:00:00",
    time: "19:00",
    locationName: "Igreja N. Sra. dos Remédios",
    address: "Rua Rainha Ginga, Luanda, Angola",
    receptionName: "Epic Sana Luanda",
    receptionAddress: "Rua da Missão, Luanda",
    mapLink: "https://goo.gl/maps/example",
    heroImage:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=2670&auto=format&fit=crop",
    description:
      '"Acima de tudo, porém, revistam-se do amor, que é o elo perfeito." (Colossenses 3:14).',
    musicTrack: "Waltz No. 2 - Shostakovich",
    themeColor: "#C0C0C0",
    mapImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2670&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2670&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "19:00",
        title: "Recepção",
        description: "Welcome Drink no Foyer",
      },
      { time: "20:30", title: "Jantar de Gala", description: "Salão Diamante" },
    ],
    gifts: [
      {
        type: "IBAN",
        title: "Nossa Lua de Mel",
        description: "Sua presença é nosso maior presente.",
        value: "AO06 0040 0000 1234 5678 9012 3",
      },
    ],
  },
  {
    id: "wedding-rustic",
    type: ThemeType.WEDDING,
    layoutMode: "RUSTIC",
    title: "Helena & Pedro",
    hosts: "Convidam para celebrar o amor",
    date: "10 . AGO . 2025",
    isoDate: "2025-08-10T15:00:00",
    time: "15:00",
    locationName: "Fazenda Pôr do Sol",
    address: "Viana, Luanda, Angola",
    heroImage:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2670&auto=format&fit=crop",
    description:
      '"O amor não se vê com os olhos, mas com o coração." Vamos celebrar nossa união em meio à natureza, com simplicidade e muito carinho.',
    musicTrack: "I Won't Give Up - Jason Mraz",
    themeColor: "#A67B5B",
    mapImage:
      "https://images.unsplash.com/photo-1519225448526-0645155bead2?q=80&w=2574&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596522354195-e84e9c0a5d7e?q=80&w=2670&auto=format&fit=crop",
    ],
    timeline: [
      {
        time: "15:00",
        title: "Chegada",
        description: "Recepção com Águas Aromatizadas",
      },
      {
        time: "16:00",
        title: "Cerimônia",
        description: "Debaixo da Árvore Grande",
      },
      {
        time: "17:30",
        title: "Sunset Party",
        description: "Música Folk ao Vivo",
      },
      {
        time: "20:00",
        title: "Jantar Caipira",
        description: "Buffet da Fazenda",
      },
    ],
    dressCode: {
      title: "Casual Chic",
      description:
        "Salto grosso é recomendado para as mulheres devido ao gramado. Tons terrosos combinam com o cenário.",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop",
    },
    gifts: [
      {
        type: "IBAN",
        title: "Nossa Lua de Mel",
        description: "Ajude-nos a viajar pelo mundo:",
        value: "AO06 1234 5678 9012 3456 7890 1",
      },
    ],
  },
  {
    id: "wedding-industrial",
    type: ThemeType.WEDDING,
    layoutMode: "INDUSTRIAL",
    title: "Bianca & Gabriel",
    hosts: "The Wedding",
    brideParents: "Márcia & Renato",
    groomParents: "Cláudia & Fernando",
    date: "05 . SET . 2025",
    isoDate: "2025-09-05T20:00:00",
    time: "20:00",
    locationName: "Galeria 12",
    address: "Ilha de Luanda, Angola",
    heroImage:
      "https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=2672&auto=format&fit=crop",
    description:
      "Minimalista. Urbano. Intenso. Convidamos você para uma noite de celebração moderna, boa música e arte.",
    musicTrack: "Midnight City - M83 (Piano Cover)",
    themeColor: "#333333",
    mapImage:
      "https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2670&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=2670&auto=format&fit=crop",
    ],
    timeline: [
      { time: "20:00", title: "Cocktail Hour", description: "Rooftop Bar" },
      { time: "21:30", title: "Civil & Votos", description: "Main Hall" },
      {
        time: "22:30",
        title: "Dinner Party",
        description: "Estilo Finger Food",
      },
      { time: "00:00", title: "After Party", description: "DJ Guest" },
    ],
    dressCode: {
      title: "Black & White",
      description:
        "Pedimos que todos os convidados vistam apenas preto ou branco. Ousadia é bem-vinda.",
      image:
        "https://images.unsplash.com/photo-1550614000-4b9519e02a48?q=80&w=2574&auto=format&fit=crop",
    },
    gifts: [
      {
        type: "IBAN",
        title: "Arte & Decor",
        description: "Contribua para a decoração do nosso loft:",
        value: "AO06 9999 8888 7777 6666 5555 4",
      },
    ],
  },
  {
    id: "bridal-beauty",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_BEAUTY",
    title: "Chá de Panela da Jussineide",
    hosts: "Vai Estar no Salão",
    date: "20 de Junho de 2026",
    isoDate: "2026-06-20T14:00:00",
    time: "14h às 19h",
    locationName: "Casa da Noiva",
    address: "Luanda, Angola",
    receptionName: "",
    receptionAddress: "",
    mapLink: "https://goo.gl/maps/example",
    heroImage: "/bridal-templates/templateCha1.webp",
    description:
      "Você é uma pessoa muito especial na minha vida e por isso, quero que esteja presente no meu chá de panela! Vamos reunir a mulherada e comemorar!",
    musicTrack: "Bossa Nova Cover",
    themeColor: "#E6A8A8",
    timeline: [],
    gifts: [],
  },
  {
    id: "bridal-romantic",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_ROMANTIC",
    title: "Chá de Panela da Jussineide",
    hosts: "CONVITE ESPECIAL",
    date: "20 de Junho de 2026",
    isoDate: "2026-06-20T14:00:00",
    time: "14h às 19h",
    locationName: "Casa da Noiva",
    address: "Talatona, Luanda",
    heroImage: "/bridal-templates/templateCha2.webp",
    description: `Você é uma pessoa muito especial na minha vida e por isso, quero que esteja presente no meu chá de panela!
Vamos reunir a mulherada e comemorar!`,
    musicTrack: "Acoustic Guitar",
    themeColor: "#F48FB1",
    timeline: [],
  },
  {
    id: "bridal-minimal",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_MINIMAL",
    title: "Chá da Sofia",
    hosts: "Let's Celebrate",
    date: "15 de Agosto de 2026",
    isoDate: "2026-08-15T15:00:00",
    time: "15:00",
    locationName: "Rooftop Bar",
    address: "Luanda, Angola",
    heroImage: "/bridal-templates/templateCha3.webp",
    description:
      "Um encontro intimista, minimalista e cheio de charme. Venha brindar comigo este novo capítulo em um chá de panela especial.",
    musicTrack: "Bossa Nova Cover",
    themeColor: "#D3C4B7",
    timeline: [],
  },
  {
    id: "bridal-tea-party",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_TEA_PARTY",
    title: "Chá da Tarde da Ana",
    hosts: "Chá de Panela",
    date: "05 de Setembro de 2026",
    isoDate: "2026-09-05T16:00:00",
    time: "16:00",
    locationName: "Jardim de Inverno",
    address: "Talatona, Luanda",
    heroImage: "/bridal-templates/templateCha4.webp",
    description:
      "Vista-se com amor e venha tomar uma xícara de chá comigo. Uma tarde vintage para celebrarmos juntas o meu chá de panela!",
    musicTrack: "Acoustic Guitar",
    themeColor: "#B5C1C8",
    timeline: [],
  },
  {
    id: "bridal-chef",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_CHEF",
    title: "Chá da Laura",
    hosts: "Chá de Panela",
    date: "12 de Outubro de 2026",
    isoDate: "2026-10-12T15:00:00",
    time: "15:00",
    locationName: "Espaço Gastrô",
    address: "Mutamba, Luanda",
    heroImage:
      "https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=2000&auto=format&fit=crop",
    description:
      "Uma tarde especial de muito afeto e boa gastronomia! Venha temperar meu dia e celebrar o início de uma nova fase.",
    musicTrack: "Bossa Nova Cover",
    themeColor: "#CB6843",
    timeline: [],
    gifts: [
      {
        type: "IBAN",
        title: "Utensílios da Chef",
        description:
          "Sinta-se à vontade para nos ajudar a equipar nossa nova cozinha!",
        value: "AO06 0000 1111 2222 3333 4444 5",
        bankName: "BCA",
        accountName: "Laura Silva",
      },
    ],
  },
  {
    id: "bridal-tropical",
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: "BRIDAL_TROPICAL",
    title: "Salvador & Manuela",
    hosts: "Vocês estão convidados!",
    date: "15 de Novembro de 2026",
    isoDate: "2026-11-15T14:00:00",
    time: "14:00",
    locationName: "Espaço das Palmeiras",
    address: "Ilha do Cabo, Luanda",
    mapLink: "https://maps.app.goo.gl/Tropical",
    heroImage:
      "https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    description:
      "Estamos montando a nossa cozinha e adoraríamos contar com a sua presença para uma tarde de boas risadas, comida gostosa e muita alegria.",
    musicTrack: "Samba Rock",
    themeColor: "#059669",
    timeline: [],
    gifts: [
      {
        type: "IBAN",
        title: "Presente em Dinheiro",
        description: "Ajude-nos a mobilar nosso novo lar.",
        value: "AO06 0000 1111 2222 3333 4444 5",
        bankName: "BFA",
        accountName: "Manuela & Salvador",
      },
    ],
  },
  {
    id: "baby-boy",
    type: ThemeType.BABY_SHOWER,
    layoutMode: "BABY_BOY",
    title: "Chá do Lorenzo",
    hosts: "À Espera do Nosso Príncipe",
    date: "10 de Outubro de 2026",
    isoDate: "2026-10-10T15:00:00",
    time: "15:00",
    locationName: "Salão de Festas - Condomínio Rosas",
    address: "Talatona, Luanda, Angola",
    heroImage:
      "https://images.unsplash.com/photo-1519689680058-324335c77eb2?q=80&w=2000&auto=format&fit=crop",
    description:
      "Um novo príncipe está para chegar e queremos celebrar com todos os que amamos! Venha partilhar connosco este momento doce e mágico.",
    musicTrack: "Disney Lullaby Piano",
    themeColor: "#1E3A8A",
    timeline: [],
    gifts: [
      {
        type: "IBAN",
        title: "Mimos para o Enxoval",
        description: "Se desejar presentear o Lorenzo com um mimo em dinheiro:",
        value: "AO06 0055 0000 1122 3344 5566 7",
        bankName: "BAI",
        accountName: "Beatriz e Carlos",
      },
    ],
  },
  {
    id: "baby-girl",
    type: ThemeType.BABY_SHOWER,
    layoutMode: "BABY_GIRL",
    title: "Chá da Alícia",
    hosts: "À Espera da Nossa Princesa",
    date: "24 de Outubro de 2026",
    isoDate: "2026-10-24T16:00:00",
    time: "16:00",
    locationName: "Jardim da Vovó",
    address: "Viana, Luanda, Angola",
    heroImage:
      "https://images.unsplash.com/photo-1541014741259-df5290b3785a?q=80&w=2000&auto=format&fit=crop",
    description:
      "O nosso mundo vai ficar cor-de-rosa! Venha comemorar a doce espera pela nossa pequena Alícia numa tarde cheia de doçura.",
    musicTrack: "Disney Lullaby Piano",
    themeColor: "#BE185D",
    timeline: [],
    gifts: [
      {
        type: "IBAN",
        title: "Mimos para a Princesa",
        description:
          "Qualquer contribuição para o quartinho da Alícia será recebida com amor:",
        value: "AO06 0055 0000 9988 7766 5544 3",
        bankName: "BFA",
        accountName: "Juliana e Marcos",
      },
    ],
  },
];

export const getEventById = (id: string) => EVENTS.find((e) => e.id === id);
export const getEventByLayoutMode = (layoutMode: string) =>
  EVENTS.find((e) => e.layoutMode === layoutMode);
