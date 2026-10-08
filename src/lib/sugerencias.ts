// Atajos para redactar: cada sugerencia agrega una línea al campo de texto.

export interface Sugerencia {
  texto: string
  /** Lo que se agrega al campo; por omisión, `texto`. */
  insertar?: string
}

const pregunta = (texto: string, insertar = texto): Sugerencia => ({ texto, insertar: `${insertar}: ` })

export const ANTECEDENTES: Sugerencia[] = [
  pregunta('Usa lentes'),
  pregunta('Última revisión', 'Última revisión visual'),
  pregunta('Diabetes'),
  pregunta('Hipertensión'),
  pregunta('Medicamentos'),
  pregunta('Alergias'),
  pregunta('Cirugías o traumas oculares', 'Cirugías o traumatismos oculares'),
  pregunta('Antecedentes familiares', 'Antecedentes familiares oculares'),
  pregunta('Uso de pantallas', 'Uso de pantallas (horas al día)'),
]

export const EXPLORACION: Sugerencia[] = [
  pregunta('Párpados y anexos'),
  pregunta('Conjuntiva'),
  pregunta('Córnea'),
  pregunta('Cámara anterior'),
  pregunta('Pupilas'),
  pregunta('Cristalino'),
  pregunta('Fondo de ojo'),
  pregunta('Motilidad ocular'),
  pregunta('Presión intraocular'),
]

export const DIAGNOSTICOS: Sugerencia[] = [
  { texto: 'Miopía' },
  { texto: 'Hipermetropía' },
  { texto: 'Astigmatismo' },
  { texto: 'Presbicia' },
  { texto: 'Emetropía' },
  { texto: 'Anisometropía' },
]

export const TRATAMIENTOS: Sugerencia[] = [
  { texto: 'Lentes monofocales' },
  { texto: 'Lentes bifocales' },
  { texto: 'Lentes progresivos' },
  { texto: 'Antirreflejante' },
  { texto: 'Filtro de luz azul' },
  { texto: 'Fotocromático' },
  { texto: 'Lentes de contacto' },
  { texto: 'Lubricante ocular' },
  { texto: 'Revisión en 1 año' },
  { texto: 'Referir a oftalmología' },
]
