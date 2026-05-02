export const validateRUN = (run: string): boolean => {
  // Remove dots and hyphens
  const cleanRUN = run.replace(/[.\-\s]/g, '');
  
  if (cleanRUN.length < 8 || cleanRUN.length > 9) {
    return false;
  }

  const body = cleanRUN.slice(0, -1);
  const checkDigit = cleanRUN.slice(-1).toLowerCase();

  // Validate that body contains only numbers
  if (!/^\d+$/.test(body)) {
    return false;
  }

  // Calculate check digit using Chilean algorithm
  let sum = 0;
  let multiplier = 2;

  // Process from right to left
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier++;
    if (multiplier > 7) {
      multiplier = 2;
    }
  }

  const remainder = sum % 11;
  const calculatedDigit = 11 - remainder;
  
  let expectedDigit: string;
  if (calculatedDigit === 11) {
    expectedDigit = '0';
  } else if (calculatedDigit === 10) {
    expectedDigit = 'k';
  } else {
    expectedDigit = calculatedDigit.toString();
  }

  return checkDigit === expectedDigit;
};

export const formatRUN = (run: string): string => {
  // Remove all non-alphanumeric characters except K/k
  const cleanRUN = run.replace(/[^0-9Kk]/g, '');
  
  if (cleanRUN.length < 2) return cleanRUN;
  
  const body = cleanRUN.slice(0, -1);
  const checkDigit = cleanRUN.slice(-1);
  
  // Don't format if too short
  if (body.length < 7) {
    return cleanRUN;
  }
  
  // Format as XX.XXX.XXX-X
  let formatted = '';
  const reversedBody = body.split('').reverse().join('');
  
  for (let i = 0; i < reversedBody.length; i++) {
    if (i > 0 && i % 3 === 0) {
      formatted = '.' + formatted;
    }
    formatted = reversedBody[i] + formatted;
  }
  
  return `${formatted}-${checkDigit.toUpperCase()}`;
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:type;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
};

export const base64ToBlob = (base64: string, type: string): Blob => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type });
};

// Spell checker and text correction utilities
export const commonMedicalTerms = [
  'hipertensión', 'diabetes', 'demencia', 'alzheimer', 'parkinson',
  'artritis', 'osteoporosis', 'cardiopatía', 'neumonía', 'bronquitis',
  'insuficiencia', 'renal', 'hepática', 'cardíaca', 'respiratoria',
  'medicamento', 'tratamiento', 'terapia', 'rehabilitación', 'fisioterapia',
  'kinesiología', 'enfermería', 'médico', 'doctor', 'especialista',
  'diagnóstico', 'síntoma', 'evaluación', 'examen', 'control',
  'seguimiento', 'monitoreo', 'observación', 'cuidado', 'atención'
];

export const correctSpelling = (text: string): string => {
  let correctedText = text;
  
  // Common spelling corrections for Spanish medical terms
  const corrections: { [key: string]: string } = {
    'hipertencion': 'hipertensión',
    'diabetis': 'diabetes',
    'demencia': 'demencia',
    'alsheimer': 'alzheimer',
    'parquinson': 'parkinson',
    'artritris': 'artritis',
    'osteoporsis': 'osteoporosis',
    'cardiopatia': 'cardiopatía',
    'neumonia': 'neumonía',
    'bronquitis': 'bronquitis',
    'insuficiecia': 'insuficiencia',
    'medicamneto': 'medicamento',
    'tratamient': 'tratamiento',
    'terapia': 'terapia',
    'rehabilitacion': 'rehabilitación',
    'fisioterapia': 'fisioterapia',
    'kinesiologia': 'kinesiología',
    'enfermeria': 'enfermería',
    'medico': 'médico',
    'diagnostico': 'diagnóstico',
    'sintoma': 'síntoma',
    'evaluacion': 'evaluación',
    'observacion': 'observación'
  };
  
  // Apply corrections
  Object.entries(corrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    correctedText = correctedText.replace(regex, correct);
  });
  
  return correctedText;
};

export const suggestCorrections = (word: string): string[] => {
  const suggestions: string[] = [];
  const lowerWord = word.toLowerCase();
  
  // Find similar medical terms
  commonMedicalTerms.forEach(term => {
    if (term.includes(lowerWord) || lowerWord.includes(term)) {
      suggestions.push(term);
    }
  });
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
};

// Auto-capitalize proper nouns and medical terms
export const autoCapitalize = (text: string): string => {
  return text.replace(/\b\w+/g, (word) => {
    const lowerWord = word.toLowerCase();
    
    // Capitalize medical terms and proper nouns
    const properNouns = ['alzheimer', 'parkinson', 'chile', 'santiago'];
    if (properNouns.includes(lowerWord)) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    return word;
  });
};