export const C = {
  rateTypes: ['normal', 'saturdayPre', 'saturdayPost'],
  rateTypesMap: {
    normal: 'Horario normal (L a V)',
    saturdayPre: 'Sábado hasta las 14:00',
    saturdayPost: 'Sábado después de las 14:00',
  },
} as const;

export default C;
