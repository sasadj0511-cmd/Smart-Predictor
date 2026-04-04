export function extractJSON(text: string): any {
  if (!text) return {};
  try {
    // 1. Pokušaj direktno (najbrže)
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Pokušaj da nađeš sadržaj između prve { i poslednje }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJSON = text.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(potentialJSON);
      } catch (innerError) {
        // 3. Pokušaj da očistiš markdown blokove ako postoje
        const cleaned = text.replace(/```json|```/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch (finalError) {
          console.error("Sve metode parsiranja JSON-a su zakazale:", text);
          throw finalError;
        }
      }
    }
    throw e;
  }
}
