export const C = {
  rateTypes: ['normal', 'saturdayPre', 'saturdayPost'],
  rateTypesMap: {
    normal: 'Horario normal (L a V)',
    saturdayPre: 'Sábado hasta las 14:30',
    saturdayPost: 'Sábado después de las 14:30',
  },
  months: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
} as const;

export default C;
