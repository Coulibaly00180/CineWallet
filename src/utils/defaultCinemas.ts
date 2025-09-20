import { createId } from '@/utils/id';

export type DefaultCinema = {
  id: string;
  name: string;
  slug: string;
  website?: string;
  logoUri?: string;
  primaryColor: string;
  secondaryColor: string;
  qrFormat?: string;
  city?: string;
  country: string;
  phone?: string;
  notes?: string;
};

export const defaultCinemas: DefaultCinema[] = [
  {
    id: createId(),
    name: 'UGC Ciné Cité',
    slug: 'ugc-cine-cite',
    website: 'https://www.ugc.fr',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/UGC_logo_2016.svg/200px-UGC_logo_2016.svg.png',
    primaryColor: '#e63946',
    secondaryColor: '#ffebee',
    qrFormat: 'URL - Liens vers espace client UGC',
    city: 'Multiple',
    country: 'France',
    notes: 'Chaîne de cinémas présente dans toute la France',
  },
  {
    id: createId(),
    name: 'Pathé',
    slug: 'pathe',
    website: 'https://www.pathe.fr',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Path%C3%A9_logo.svg/200px-Path%C3%A9_logo.svg.png',
    primaryColor: '#1a1a1a',
    secondaryColor: '#f5f5f5',
    qrFormat: 'CODEWEB - Code alphanumérique court',
    city: 'Multiple',
    country: 'France',
    notes: 'Réseau de cinémas français historique',
  },
  {
    id: createId(),
    name: 'Gaumont',
    slug: 'gaumont',
    website: 'https://www.gaumont.com',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Gaumont_logo.svg/200px-Gaumont_logo.svg.png',
    primaryColor: '#ff6b35',
    secondaryColor: '#fff3e0',
    qrFormat: 'TEXT - Code texte avec identifiant de séance',
    city: 'Multiple',
    country: 'France',
    notes: 'Plus ancien studio de cinéma au monde encore en activité',
  },
  {
    id: createId(),
    name: 'CGR Cinemas',
    slug: 'cgr-cinemas',
    website: 'https://www.cgrcinemas.fr',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/CGR_Cinemas_logo.svg/200px-CGR_Cinemas_logo.svg.png',
    primaryColor: '#2196f3',
    secondaryColor: '#e3f2fd',
    qrFormat: 'URL - Lien de validation en ligne',
    city: 'Multiple',
    country: 'France',
    notes: 'Groupe indépendant français de cinémas',
  },
  {
    id: createId(),
    name: 'Kinepolis',
    slug: 'kinepolis',
    website: 'https://kinepolis.fr',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Kinepolis_logo.svg/200px-Kinepolis_logo.svg.png',
    primaryColor: '#9c27b0',
    secondaryColor: '#f3e5f5',
    qrFormat: 'CODEWEB - Format propriétaire Kinepolis',
    city: 'Multiple',
    country: 'France',
    notes: 'Chaîne belge présente en France',
  },
  {
    id: createId(),
    name: 'MK2',
    slug: 'mk2',
    website: 'https://www.mk2.com',
    logoUri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/MK2_logo.svg/200px-MK2_logo.svg.png',
    primaryColor: '#ff9800',
    secondaryColor: '#fff3e0',
    qrFormat: 'TEXT - Code court avec vérification mobile',
    city: 'Paris',
    country: 'France',
    notes: 'Cinémas d\'auteur principalement parisiens',
  },
  {
    id: createId(),
    name: 'Mégarama',
    slug: 'megarama',
    website: 'https://www.megarama.fr',
    primaryColor: '#4caf50',
    secondaryColor: '#e8f5e8',
    qrFormat: 'URL - Redirection vers système de validation',
    city: 'Multiple',
    country: 'France',
    notes: 'Multiplexes modernes avec technologies avancées',
  },
  {
    id: createId(),
    name: 'Les Cinémas Indépendants Parisiens',
    slug: 'cinemas-independants-parisiens',
    website: 'https://www.lescineasindependantsparisiens.fr',
    primaryColor: '#673ab7',
    secondaryColor: '#ede7f6',
    qrFormat: 'TEXT - Code simple avec numéro de place',
    city: 'Paris',
    country: 'France',
    notes: 'Réseau de cinémas indépendants parisiens',
  },
];