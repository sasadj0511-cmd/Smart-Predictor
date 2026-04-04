export function sanitizeForFirestore(data: any): any {
  if (data === null || data === undefined) return null;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item));
  }
  
  if (typeof data === 'object') {
    const sanitized: any = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      if (value === undefined || value === null) {
        // Defaults za kritična polja
        if (key === 'confidence') sanitized[key] = 0;
        else if (key === 'tip') sanitized[key] = 'N/A';
        else if (key === 'reason') sanitized[key] = 'Nema analize.';
        else if (key === 'sourceLine') sanitized[key] = 'Unknown';
        else if (key === 'analyzedAt') sanitized[key] = new Date().toISOString();
        else if (key === 'analysis') sanitized[key] = '';
        else if (key === 'injuries') sanitized[key] = 'Nema podataka.';
        else if (key === 'weather') sanitized[key] = 'Nema podataka.';
        else if (key === 'matchTime') sanitized[key] = 'N/A';
        else if (key === 'totalGoals') sanitized[key] = 'N/A';
        // Sve ostalo undefined - preskoči
        return;
      }
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = sanitizeForFirestore(value);
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }
  
  return data;
}
