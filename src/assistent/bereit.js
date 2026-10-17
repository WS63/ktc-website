// Laeuft Lisa ueberhaupt? Beides ohne Importe, damit auch Bausteine das fragen duerfen.
// 'lokal' = ein Modell auf dem eigenen Rechner (Ollama o. ae.), gedacht fuer Versuche.
export const lokal = () => process.env.CHAT_ANBIETER === 'lokal';
export const assistentAktiv = () => lokal() || Boolean(process.env.ANTHROPIC_API_KEY);
