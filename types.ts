
export enum ThemeType {
  WEDDING = 'WEDDING',
  BIRTHDAY = 'BIRTHDAY',
  CORPORATE = 'CORPORATE'
}

export type LayoutMode = 'CLASSIC' | 'MODERN' | 'LUXURY' | 'GARDEN' | 'RUSTIC' | 'INDUSTRIAL';

export interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface GiftItem {
  type: 'IBAN' | 'LINK' | 'BANK'; // Alterado de PIX para IBAN
  title: string;
  value: string; // IBAN number or URL
  description?: string;
  qrCode?: string;
}

export interface TipItem {
  category: 'HOTEL' | 'SALON' | 'INFO';
  title: string;
  description: string;
  link?: string; // Google Maps or Website
  actionLabel?: string;
}

export interface DressCode {
  title: string;
  description: string;
  image?: string; // URL to an example image or icon
}

export interface EventDetails {
  id: string;
  type: ThemeType;
  layoutMode: LayoutMode; 
  title: string;
  hosts: string;
  date: string;
  isoDate: string; 
  time: string;
  
  // Locations
  locationName: string;
  address: string;
  mapLink?: string; 
  receptionName?: string; // Optional separate reception
  receptionAddress?: string;

  heroImage: string;
  description: string;
  musicTrack: string;
  timeline: TimelineItem[];
  mapImage?: string;
  gallery?: string[];
  themeColor?: string;
  
  // New Sections
  gifts?: GiftItem[];
  tips?: TipItem[];
  dressCode?: DressCode;
  phone?: string; // Add phone
}

export interface ThemeConfig {
  bg: string;
  text: string;
  accent: string;
  fontHead: string;
  fontBody: string;
  button: string;
  nav: string;
}
