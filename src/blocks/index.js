import nav from './nav.js';
import hero from './hero.js';
import richtext from './richtext.js';
import cards from './cards.js';
import preise from './preise.js';
import beitragsliste from './beitragsliste.js';
import personen from './personen.js';
import faq from './faq.js';
import tabelle from './tabelle.js';
import infokarten from './infokarten.js';
import termine from './termine.js';
import bild from './bild.js';
import galerie from './galerie.js';
import streifen from './streifen.js';
import aktuell from './aktuell.js';
import ergebnisse from './ergebnisse.js';
import formular from './formular.js';
import assistent from './assistent.js';
import hinweisband from './hinweisband.js';
import kapitel from './kapitel.js';
import abo from './abo.js';
import footer from './footer.js';

export const blocks = Object.fromEntries(
  [nav, hero, richtext, cards, preise, beitragsliste, personen, faq, tabelle, infokarten, termine, bild, galerie, streifen, aktuell, ergebnisse, formular, hinweisband, kapitel, abo, assistent, footer].map((b) => [b.name, b]));
