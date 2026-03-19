export const MACHINE_MAP: Record<string, string[]> = {
  Extrusion: ['BT', 'BT-C'],
  Filler: ['GMF-C', 'Flexline', 'RUF', 'RUF-C'],
  Mould: ['RIA4', 'RIA10-C', 'RIA14'],
};

export const PRODUCT_TYPE_MAP: Record<string, string[]> = {
  BT: ['Stick', 'Full Sandwich', 'Half Sandwich', 'Round Sandwich', 'Bite', 'Bar', 'Log', 'Toblerone Stick', 'Vienetta Stick', 'Cake', 'Twister', 'Ball Cone'],
  'BT-C': ['Stick', 'Full Sandwich', 'Half Sandwich', 'Round Sandwich', 'Bite', 'Bar', 'Log', 'Toblerone Stick', 'Vienetta Stick', 'Cake', 'Twister', 'Ball Cone'],
  'GMF-C': ['Cone', 'Round Cup', 'Bulks', 'Squeeze Up'],
  Flexline: ['Cone', 'Round Cup', 'Bulks', 'Squeeze Up'],
  RUF: ['Cone', 'Round Cup', 'Bulks', 'Squeeze Up'],
  'RUF-C': ['Cone', 'Round Cup', 'Bulks', 'Squeeze Up'],
  RIA4: ['1 Flavor Stick', 'Shell & Core Product', 'Traffic Light Product'],
  'RIA10-C': ['1 Flavor Stick', 'Shell & Core Product', 'Traffic Light Product'],
  RIA14: ['1 Flavor Stick', 'Shell & Core Product', 'Traffic Light Product'],
};

export const MACHINE_TYPES = Object.keys(MACHINE_MAP);
export const STICK_PRODUCT_TYPES = ['Stick', 'Vienetta Stick', 'Twister'];
export const CONE_PRODUCT_TYPES = ['Cone', 'Ball Cone'];

export const COATING_SEQUENCE_MAP: Record<string, string> = {
  single_dip: '1 x choco dip',
  multi_chocolate_dip: '1xchoco|1xcaramel|1xnitrogen|1xchoco|1xnitrogen',
  juice_dipping: '1xjuice|1xnitrogen|1xjuice|1xnitrogen|',
};

export const RIPPLE_SAUCE_PATTERNS = [
  { value: 'random_pattern', label: 'Random Pattern' },
  { value: 'pencil_filler', label: 'Pencil Filler' },
  { value: 'swirl_pattern', label: 'Swirl Pattern' },
];

export const CHOCOLATE_COATING_TYPES = [
  { value: 'single_dip', label: 'Single Dip' },
  { value: 'multi_chocolate_dip', label: 'Multi Choco Dip' },
  { value: 'juice_dipping', label: 'Juice Dipping' },
  { value: 'other', label: 'Other' },
];

export const STICK_TYPES = [
  { value: 'straight_stick', label: 'Straight Stick' },
  { value: 'paddle_stick', label: 'Paddle Stick' },
  { value: 'twin_stick', label: 'Twin Stick' },
  { value: 'other', label: 'Other' },
];

export const CONE_DEGREES = [
  { value: '18', label: '18°' },
  { value: '22', label: '22°' },
  { value: '30', label: '30°' },
  { value: 'other', label: 'Other' },
];
