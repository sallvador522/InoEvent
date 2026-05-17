
import { EventDetails, ThemeType } from './types';

export const EVENTS: EventDetails[] = [
  // 1. O Clássico Romântico (Azul Navy)
  {
    id: 'wedding-classic',
    type: ThemeType.WEDDING,
    layoutMode: 'CLASSIC',
    title: 'Isabella & Lucas',
    hosts: 'Juntamente com seus pais',
    date: '24 . OUT . 2024',
    isoDate: '2024-10-24T15:30:00',
    time: '15:30',
    locationName: 'Catedral da Sé',
    address: 'Cidade Alta, Luanda, Angola',
    receptionName: 'Salão Nobre',
    receptionAddress: 'Clube Naval de Luanda',
    mapLink: 'https://goo.gl/maps/example',
    heroImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop',
    description: 'Com a bênção de Deus e de nossos pais, convidamos você para o nosso casamento. Um dia de amor, tradição e alegria.',
    musicTrack: 'Canon in D - Piano',
    themeColor: '#1B365D', // Navy Blue Classic
    mapImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2698&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2574&auto=format&fit=crop'
    ],
    timeline: [
      { time: '15:30', title: 'Cerimônia Religiosa', description: "Catedral da Sé" },
      { time: '17:30', title: 'Cumprimentos', description: 'Jardins da Catedral' },
      { time: '19:00', title: 'Recepção', description: 'Clube Naval' },
      { time: '21:00', title: 'Jantar', description: 'Buffet Completo' }
    ],
    dressCode: {
      title: 'Passeio Completo',
      description: 'Sugerimos trajes formais. Homens de terno e gravata, mulheres de vestido longo ou midi elegante.',
      image: 'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop'
    },
    gifts: [
      {
        type: 'IBAN',
        title: 'Presentes em Dinheiro',
        description: 'Sua presença é o nosso maior presente! Se desejar nos abençoar com alguma contribuição, sinta-se à vontade:',
        value: 'AO06 0000 0000 0000 0000 0000 0',
        bankName: 'BAI',
        accountName: 'Isabela e Lucas'
      }
    ]
  },

  // NOVO: Essencial
  {
    id: 'wedding-essential',
    type: ThemeType.WEDDING,
    layoutMode: 'CLASSIC',
    title: 'Ana & João',
    hosts: 'Com muita alegria',
    date: '10 . DEZ . 2024',
    isoDate: '2024-12-10T18:00:00',
    time: '18:00',
    locationName: 'Espaço Elegance',
    address: 'Talatona, Luanda',
    heroImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2670&auto=format&fit=crop',
    description: 'Um dia inesquecível de celebração do nosso amor. Junte-se a nós para brindarmos à vida e à felicidade (Modelo Essencial).',
    musicTrack: 'A Thousand Years - Christina Perri',
    themeColor: '#4A4A4A',
    timeline: [
      { time: '18:00', title: 'Cerimônia', description: "Jardim" },
      { time: '20:00', title: 'Recepção', description: 'Salão Principal' }
    ]
  },

  // 2. O Minimalista Etéreo
  {
    id: 'wedding-ethereal',
    type: ThemeType.WEDDING,
    layoutMode: 'MODERN',
    title: 'Camila & Tiago',
    hosts: 'Convidam para o seu casamento',
    date: '14 . SET . 2025',
    isoDate: '2025-09-14T16:00:00',
    time: '16:00',
    locationName: 'Solar dos Hibiscos',
    address: 'Mussulo, Luanda, Angola',
    heroImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=2670&auto=format&fit=crop',
    description: '"O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha." (1 Coríntios 13:4). Sua presença é essencial neste novo capítulo de nossas vidas.',
    musicTrack: 'Turning Page - Sleeping At Last',
    themeColor: '#C2B280', // Taupe/Sand
    mapImage: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=2670&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2574&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2574&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2670&auto=format&fit=crop'
    ],
    timeline: [
      { time: '16:00', title: 'Cerimônia ao Ar Livre', description: 'Gramado Principal' },
      { time: '17:30', title: 'Golden Hour', description: 'Sessão de Fotos & Coquetel' },
      { time: '19:00', title: 'Jantar Intimista', description: 'Salão de Vidro' },
      { time: '21:00', title: 'Festa', description: 'Pista de Dança' }
    ],
    dressCode: {
      title: 'Esporte Fino',
      description: 'Sugerimos tons claros e tecidos leves. O conforto é primordial.',
      image: 'https://images.unsplash.com/photo-1490427712608-588e68359dbd?q=80&w=2670&auto=format&fit=crop'
    },
    gifts: [
      {
        type: 'IBAN',
        title: 'Lua de Mel',
        description: 'Se desejar nos presentear, contribua para nossa viagem dos sonhos:',
        value: 'AO06 0055 0000 9999 8888 7777 6'
      }
    ]
  },

  // 3. O Jardim Elegante (Garden Layout)
  {
    id: 'wedding-garden',
    type: ThemeType.WEDDING,
    layoutMode: 'GARDEN',
    title: 'Mariana & Ricardo',
    hosts: 'Convidam para celebrar',
    date: '02 . FEV . 2025',
    isoDate: '2025-02-02T16:30:00',
    time: '16:30',
    locationName: 'Quinta das Palmeiras',
    address: 'Talatona, Luanda, Angola',
    heroImage: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=2574&auto=format&fit=crop',
    description: '"O amor é paciente, o amor é bondoso. Tudo sofre, tudo crê, tudo espera, tudo suporta." (1 Coríntios 13:4-7). Sua presença tornará nosso sonho ainda mais perfeito.',
    musicTrack: 'La Vie En Rose - Instrumental',
    themeColor: '#78866B', // Sage Green
    mapImage: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?q=80&w=2631&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop'
    ],
    timeline: [
      { time: '16:30', title: 'Cerimônia no Jardim', description: 'Sob o Gazebo' },
      { time: '18:00', title: 'Fotos & Brindes', description: 'Jardim das Rosas' },
      { time: '19:30', title: 'Jantar à Luz de Velas', description: 'Tenda Cristal' },
      { time: '22:00', title: 'Banda ao Vivo', description: 'Pista de Dança' }
    ],
    gifts: [
       {
         type: 'IBAN',
         title: 'Presentes em Dinheiro',
         description: 'Agradecemos por celebrar este momento conosco. Qualquer contribuição será recebida com muito amor:',
         value: 'AO06 0000 0000 0000 0000 0000 0',
         bankName: 'BAI',
         accountName: 'Eduardo e Laura'
       }
    ],
    dressCode: {
      title: 'Passeio Completo',
      description: 'Tons pastéis e tecidos leves são bem-vindos. Evite branco.',
      image: 'https://images.unsplash.com/photo-1502035618526-6b2f1f5bca1b?q=80&w=2576&auto=format&fit=crop'
    }
  },

  // 4. O Luxuoso Black Tie
  {
    id: 'wedding-royal',
    type: ThemeType.WEDDING,
    layoutMode: 'LUXURY',
    title: 'Sofia & Eduardo',
    hosts: 'Sr. e Sra. Albuquerque convidam',
    date: '15 . NOV . 2025',
    isoDate: '2025-11-15T19:00:00',
    time: '19:00',
    locationName: 'Igreja N. Sra. dos Remédios',
    address: 'Rua Rainha Ginga, Luanda, Angola',
    receptionName: 'Epic Sana Luanda',
    receptionAddress: 'Rua da Missão, Luanda',
    mapLink: 'https://goo.gl/maps/example',
    heroImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=2670&auto=format&fit=crop',
    description: '"Acima de tudo, porém, revistam-se do amor, que é o elo perfeito." (Colossenses 3:14).',
    musicTrack: 'Waltz No. 2 - Shostakovich',
    themeColor: '#C0C0C0', // Prata
    mapImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2670&auto=format&fit=crop',
    gallery: [
       'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=2670&auto=format&fit=crop'
    ],
    timeline: [
      { time: '19:00', title: 'Recepção', description: 'Welcome Drink no Foyer' },
      { time: '20:30', title: 'Jantar de Gala', description: 'Salão Diamante' }
    ],
    gifts: [
      {
        type: 'IBAN',
        title: 'Nossa Lua de Mel',
        description: 'Sua presença é nosso maior presente.',
        value: 'AO06 0040 0000 1234 5678 9012 3'
      }
    ]
  },

  // 5. NOVO: Rústico Chic (Fazenda/Campo)
  {
    id: 'wedding-rustic',
    type: ThemeType.WEDDING,
    layoutMode: 'RUSTIC',
    title: 'Helena & Pedro',
    hosts: 'Convidam para celebrar o amor',
    date: '10 . AGO . 2025',
    isoDate: '2025-08-10T15:00:00',
    time: '15:00',
    locationName: 'Fazenda Pôr do Sol',
    address: 'Viana, Luanda, Angola',
    heroImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=2670&auto=format&fit=crop',
    description: '"O amor não se vê com os olhos, mas com o coração." Vamos celebrar nossa união em meio à natureza, com simplicidade e muito carinho.',
    musicTrack: 'I Won\'t Give Up - Jason Mraz',
    themeColor: '#A67B5B', // Warm Brown
    mapImage: 'https://images.unsplash.com/photo-1519225448526-0645155bead2?q=80&w=2574&auto=format&fit=crop',
    gallery: [
       'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
       'https://images.unsplash.com/photo-1596522354195-e84e9c0a5d7e?q=80&w=2670&auto=format&fit=crop'
    ],
    timeline: [
       { time: '15:00', title: 'Chegada', description: 'Recepção com Águas Aromatizadas' },
       { time: '16:00', title: 'Cerimônia', description: 'Debaixo da Árvore Grande' },
       { time: '17:30', title: 'Sunset Party', description: 'Música Folk ao Vivo' },
       { time: '20:00', title: 'Jantar Caipira', description: 'Buffet da Fazenda' }
    ],
    dressCode: {
       title: 'Casual Chic',
       description: 'Salto grosso é recomendado para as mulheres devido ao gramado. Tons terrosos combinam com o cenário.',
       image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2670&auto=format&fit=crop'
    },
    gifts: [
       {
         type: 'IBAN',
         title: 'Nossa Lua de Mel',
         description: 'Ajude-nos a viajar pelo mundo:',
         value: 'AO06 1234 5678 9012 3456 7890 1'
       }
    ]
  },

  // 6. NOVO: Industrial Urbano (Moderno/Edgy)
  {
    id: 'wedding-industrial',
    type: ThemeType.WEDDING,
    layoutMode: 'INDUSTRIAL',
    title: 'Bianca & Gabriel',
    hosts: 'The Wedding',
    date: '05 . SET . 2025',
    isoDate: '2025-09-05T20:00:00',
    time: '20:00',
    locationName: 'Galeria 12',
    address: 'Ilha de Luanda, Angola',
    heroImage: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?q=80&w=2672&auto=format&fit=crop',
    description: 'Minimalista. Urbano. Intenso. Convidamos você para uma noite de celebração moderna, boa música e arte.',
    musicTrack: 'Midnight City - M83 (Piano Cover)',
    themeColor: '#333333', // Dark Grey
    mapImage: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=2670&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?q=80&w=2670&auto=format&fit=crop'
    ],
    timeline: [
       { time: '20:00', title: 'Cocktail Hour', description: 'Rooftop Bar' },
       { time: '21:30', title: 'Civil & Votos', description: 'Main Hall' },
       { time: '22:30', title: 'Dinner Party', description: 'Estilo Finger Food' },
       { time: '00:00', title: 'After Party', description: 'DJ Guest' }
    ],
    dressCode: {
       title: 'Black & White',
       description: 'Pedimos que todos os convidados vistam apenas preto ou branco. Ousadia é bem-vinda.',
       image: 'https://images.unsplash.com/photo-1550614000-4b9519e02a48?q=80&w=2574&auto=format&fit=crop'
    },
    gifts: [
      {
        type: 'IBAN',
        title: 'Arte & Decor',
        description: 'Contribua para a decoração do nosso loft:',
        value: 'AO06 9999 8888 7777 6666 5555 4'
      }
    ]
  },

  // 7. NOVO: Chá de Panela (BRIDAL BEAUTY)
  {
    id: 'bridal-beauty',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_BEAUTY',
    title: 'Chá de Panela da Jussineide',
    hosts: 'Vai Estar no Salão',
    date: '20 de Junho de 2026',
    isoDate: '2026-06-20T14:00:00',
    time: '14h às 19h',
    locationName: 'Casa da Noiva',
    address: 'Luanda, Angola',
    receptionName: '',
    receptionAddress: '',
    mapLink: 'https://goo.gl/maps/example',
    heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=2000&auto=format&fit=crop', // Makeup/Beauty
    description: 'Você é uma pessoa muito especial na minha vida e por isso, quero que esteja presente no meu chá de panela! Vamos reunir a mulherada e comemorar!',
    musicTrack: 'Bossa Nova Cover',
    themeColor: '#E6A8A8', // Pastel pink
    timeline: [],
    gifts: []
  },

  // 8. NOVO: Chá de Panela (BRIDAL ROMANTIC)
  {
    id: 'bridal-romantic',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_ROMANTIC',
    title: 'Chá de Panela da Jussineide',
    hosts: 'CONVITE ESPECIAL',
    date: '20 de Junho de 2026',
    isoDate: '2026-06-20T14:00:00',
    time: '14h às 19h',
    locationName: 'Casa da Noiva',
    address: 'Talatona, Luanda',
    heroImage: 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=2000&auto=format&fit=crop', // Pink Roses
    description: 'Você é uma pessoa muito especial na minha vida e por isso, quero que esteja presente no meu chá de panela!\nVamos reunir a mulherada e comemorar!',
    musicTrack: 'Acoustic Guitar',
    themeColor: '#F48FB1', // Pink
    timeline: []
  },

  // 9. NOVO: Chá de Panela (BRIDAL MINIMAL)
  {
    id: 'bridal-minimal',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_MINIMAL',
    title: 'Chá da Sofia',
    hosts: 'Let\'s Celebrate',
    date: '15 de Agosto de 2026',
    isoDate: '2026-08-15T15:00:00',
    time: '15:00',
    locationName: 'Rooftop Bar',
    address: 'Luanda, Angola',
    heroImage: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2000&auto=format&fit=crop', // Minimalist cake/decor
    description: 'Um encontro intimista, minimalista e cheio de charme. Venha brindar comigo este novo capítulo em um chá de panela especial.',
    musicTrack: 'Bossa Nova Cover',
    themeColor: '#D3C4B7', // Nude / Beige
    timeline: []
  },

  // 10. NOVO: Chá de Panela (BRIDAL TEA PARTY)
  {
    id: 'bridal-tea-party',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_TEA_PARTY',
    title: 'Chá da Tarde da Ana',
    hosts: 'Chá de Panela',
    date: '05 de Setembro de 2026',
    isoDate: '2026-09-05T16:00:00',
    time: '16:00',
    locationName: 'Jardim de Inverno',
    address: 'Talatona, Luanda',
    heroImage: 'https://images.unsplash.com/photo-1582662057262-6718cf2ce64b?q=80&w=2000&auto=format&fit=crop', // Tea party setting
    description: 'Vista-se com amor e venha tomar uma xícara de chá comigo. Uma tarde vintage para celebrarmos juntas o meu chá de panela!',
    musicTrack: 'Acoustic Guitar',
    themeColor: '#B5C1C8', // Soft Blue / Lavender
    timeline: []
  },

  // 11. NOVO: Chá de Panela (BRIDAL CHEF)
  {
    id: 'bridal-chef',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_CHEF',
    title: 'Chá da Laura',
    hosts: 'Chá de Panela',
    date: '12 de Outubro de 2026',
    isoDate: '2026-10-12T15:00:00',
    time: '15:00',
    locationName: 'Espaço Gastrô',
    address: 'Mutamba, Luanda',
    heroImage: 'https://images.unsplash.com/photo-1556910103-1c02745a872f?q=80&w=2000&auto=format&fit=crop', // Kitchen / Cooking setting
    description: 'Uma tarde especial de muito afeto e boa gastronomia! Venha temperar meu dia e celebrar o início de uma nova fase.',
    musicTrack: 'Bossa Nova Cover',
    themeColor: '#CB6843', // Terracota
    timeline: [],
    gifts: [
      {
        type: 'IBAN',
        title: 'Utensílios da Chef',
        description: 'Sinta-se à vontade para nos ajudar a equipar nossa nova cozinha!',
        value: 'AO06 0000 1111 2222 3333 4444 5',
        bankName: 'BCA',
        accountName: 'Laura Silva'
      }
    ]
  },

  // 12. NOVO: Chá de Panela (BRIDAL TROPICAL)
  {
    id: 'bridal-tropical',
    type: ThemeType.BRIDAL_SHOWER,
    layoutMode: 'BRIDAL_TROPICAL',
    title: 'Salvador & Manuela',
    hosts: 'Vocês estão convidados!',
    date: '15 de Novembro de 2026',
    isoDate: '2026-11-15T14:00:00',
    time: '14:00',
    locationName: 'Espaço das Palmeiras',
    address: 'Ilha do Cabo, Luanda',
    location: 'https://maps.app.goo.gl/Tropical',
    heroImage: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    description: 'Estamos montando a nossa cozinha e adoraríamos contar com a sua presença para uma tarde de boas risadas, comida gostosa e muita alegria.',
    musicTrack: 'Samba Rock',
    themeColor: '#059669', // Emerald
    timeline: [],
    gifts: [
      {
        type: 'IBAN',
        title: 'Presente em Dinheiro',
        description: 'Ajude-nos a mobilar nosso novo lar.',
        value: 'AO06 0000 1111 2222 3333 4444 5',
        bankName: 'BFA',
        accountName: 'Manuela & Salvador'
      }
    ]
  }
];

export const getEventById = (id: string): EventDetails | undefined => {
  return EVENTS.find(e => e.id === id);
};

export const getEventByLayoutMode = (layoutMode: string): EventDetails | undefined => {
  return EVENTS.find(e => e.layoutMode === layoutMode);
};
