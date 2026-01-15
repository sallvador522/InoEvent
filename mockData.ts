
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
    heroImage: 'https://images.unsplash.com/photo-1519225448526-0645155bead2?q=80&w=2574&auto=format&fit=crop',
    description: 'Com a bênção de Deus e de nossos pais, convidamos você para o nosso casamento. Um dia de amor, tradição e alegria.',
    musicTrack: 'Canon in D - Piano',
    themeColor: '#1B365D', // Navy Blue Classic
    mapImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop',
    timeline: [
      { time: '15:30', title: 'Cerimônia Religiosa', description: "Catedral da Sé" },
      { time: '17:30', title: 'Cumprimentos', description: 'Jardins da Catedral' },
      { time: '19:00', title: 'Recepção', description: 'Clube Naval' },
      { time: '21:00', title: 'Jantar', description: 'Buffet Completo' }
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
    heroImage: 'https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2670&auto=format&fit=crop',
    description: '"O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha." (1 Coríntios 13:4). Sua presença é essencial neste novo capítulo de nossas vidas.',
    musicTrack: 'Turning Page - Sleeping At Last',
    themeColor: '#C2B280', // Taupe/Sand
    mapImage: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2670&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2574&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=2574&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=2670&auto=format&fit=crop'
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
         title: 'Nossa Casa Nova',
         description: 'Ajude-nos a construir nosso lar:',
         value: 'AO06 0000 0000 0000 0000 0000 0'
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
  }
];

export const getEventById = (id: string): EventDetails | undefined => {
  return EVENTS.find(e => e.id === id);
};
