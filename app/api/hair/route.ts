import { NextRequest, NextResponse } from 'next/server';

// ── Data ────────────────────────────────────────────────────────────────────

const ROUTINES: Record<string, any> = {
  '1': {
    steps: [
      { id: 's1', name: 'Clarifying shampoo', when: 'Weekly', what: 'Sulfate-free formula on scalp only', why: 'Straight hair shows oil buildup faster' },
      { id: 's2', name: 'Lightweight conditioner', when: 'After every wash', what: 'Mid-lengths to ends, rinse fully', why: 'Heavy products weigh straight hair down' },
      { id: 's3', name: 'Volumising spray', when: 'On damp hair', what: 'Spray at roots, blow-dry upside down', why: 'Creates lift and body at the root' },
      { id: 's4', name: 'Dry shampoo refresh', when: 'Day 2-3', what: 'Spray at roots, wait 2 min, massage', why: 'Absorbs oil and adds texture between washes' },
    ],
    avoid: 'Heavy oils, silicone build-up, over-washing',
  },
  '2': {
    steps: [
      { id: 's1', name: 'Gentle shampoo', when: 'Every 2-3 days', what: 'Sulfate-free, focus on scalp', why: 'Preserves natural wave pattern' },
      { id: 's2', name: 'Hydrating conditioner', when: 'After wash', what: 'Detangle with wide-tooth comb while in', why: 'Waves tangle easily when dry' },
      { id: 's3', name: 'Scrunch with curl cream', when: 'On soaking wet hair', what: 'Apply, then scrunch upward repeatedly', why: 'Encourages wave formation as it dries' },
      { id: 's4', name: 'Diffuse or plop', when: 'After styling', what: 'Low heat diffuser or microfibre towel wrap', why: 'Air drying can flatten waves; these preserve them' },
      { id: 's5', name: 'Refresh spray', when: 'Day 2-3', what: 'Diluted leave-in in spray bottle', why: 'Revives waves without re-washing' },
    ],
    avoid: 'Brushing dry hair, heavy silicones, terrycloth towels',
  },
  '3': {
    steps: [
      { id: 's1', name: 'Co-wash or gentle shampoo', when: 'Every 3-5 days', what: 'Massage scalp gently, let suds run down', why: 'Curls need their natural oils' },
      { id: 's2', name: 'Deep condition', when: 'Weekly', what: '15-30 min with heat cap', why: 'Maximum moisture penetration' },
      { id: 's3', name: 'Leave-in + curl cream', when: 'On soaking wet hair', what: 'Praying hands method, then scrunch', why: 'Defines curl clumps without frizz' },
      { id: 's4', name: 'Gel for hold', when: 'Over cream', what: 'Apply, let dry fully, scrunch out crunch', why: 'Creates a cast that locks in definition' },
      { id: 's5', name: 'Pineapple at night', when: 'Every night', what: 'Loose ponytail on top + satin pillowcase', why: 'Preserves curls while you sleep' },
    ],
    avoid: 'Sulphates, drying alcohols, touching curls while drying',
  },
  '4': {
    steps: [
      { id: 's1', name: 'Gentle cleanse or co-wash', when: 'Every 5-7 days', what: 'Pre-poo with oil first to protect strands', why: 'Coily hair is the most fragile' },
      { id: 's2', name: 'LOC/LCO method', when: 'After wash', what: 'Liquid, Oil (jojoba/argan), Cream (butter)', why: 'Layers lock moisture in for days' },
      { id: 's3', name: 'Seal with butter or oil', when: 'Every 2-3 days', what: 'On dry sections that feel rough', why: 'Refreshes moisture between washes' },
      { id: 's4', name: 'Protective styling', when: '2-4 weeks', what: 'Twists, braids, or buns — not too tight', why: 'Minimises daily manipulation and breakage' },
      { id: 's5', name: 'Satin bonnet', when: 'Every night', what: 'Stretch and wrap gently', why: 'Cotton pillowcases strip moisture and cause friction' },
    ],
    avoid: 'Excessive manipulation, tight styles, heat without protectant',
  },
};

const STYLES: Record<string, string[]> = {
  '1A': ['Sleek Bob', 'Blunt Cut', 'Curtain Bangs', 'Low Bun', 'Side Part', 'Straight Layers'],
  '1B': ['Layered Cut', 'Lob', 'Blowout', 'Half Up', 'Sleek Ponytail', 'Textured Bob'],
  '1C': ['Textured Bob', 'Beach Waves', 'Deep Side Part', 'Low Chignon', 'Blunt Cut', 'Layers'],
  '2A': ['Beach Waves', 'Soft Layers', 'Messy Bun', 'Curtain Bangs', 'Air-Dried Texture', 'Lob'],
  '2B': ['Defined Waves', 'Shag Cut', 'Half Up Half Down', 'Diffused Waves', 'Braided Crown', 'Layered Bob'],
  '2C': ['Wash & Go', 'Curl Cream Waves', 'Layered Cut', 'Diffused Volume', 'Scrunched Curls', 'Messy Bun'],
  '3A': ['Wash & Go', 'Defined Curls', 'Layered Curls', 'Pineapple Updo', 'Twist Out', 'Diffused Curls'],
  '3B': ['Twist Out', 'Wash & Go', 'Bantu Knot Out', 'Flexi-Rod Set', 'Curly Shag', 'Puff'],
  '3C': ['Twist Out', 'Wash & Go', 'Finger Coils', 'Bantu Knots', 'Pineapple', 'Rod Set'],
  '4A': ['Twist Out', 'Coil Out', 'Bantu Knots', 'Two-Strand Twists', 'Flat Twists', 'Wash & Go'],
  '4B': ['Flat Twist Out', 'Bantu Knots', 'Protective Braids', 'Twist & Curl', 'Puff', 'Cornrows'],
  '4C': ['Bantu Knots', 'Flat Twists', 'Protective Braids', 'TWA Coils', 'Crochet Styles', 'Afro Puff'],
};

const POROSITY: Record<string, { title: string; tip: string }> = {
  low: { title: 'Open those cuticles', tip: 'Use lightweight, water-based products. Apply on warm, damp hair. Steam treatments help penetration. Avoid heavy butters — they\'ll just sit on top.' },
  medium: { title: 'You\'re in the sweet spot', tip: 'Most products work well for you. Alternate protein and moisture treatments. You have the most flexibility.' },
  high: { title: 'Lock it in', tip: 'Layer: water → leave-in → oil → cream (LOC method). Protein treatments repair porous cuticles. Use anti-humectants in humid weather.' },
  unsure: { title: 'Try the float test', tip: 'Drop a clean hair strand in a glass of water. Floats for 2+ min = low porosity. Sinks within 30 sec = high. Hovers = medium.' },
};

const DESCRIPTIONS: Record<string, string> = {
  '1A': 'Very straight, fine strands with minimal volume',
  '1B': 'Straight with some natural body and movement',
  '1C': 'Straight but thick and coarse, holds styles well',
  '2A': 'Gentle S-waves mostly at the ends',
  '2B': 'Defined S-waves from mid-length, good volume',
  '2C': 'Deep waves bordering on curls, lots of body',
  '3A': 'Wide, bouncy spiral curls with shine',
  '3B': 'Springy medium curls, dense volume',
  '3C': 'Tight pencil-sized curls packed closely',
  '4A': 'Soft S-shaped coils with visible pattern',
  '4B': 'Z-pattern coils, less defined but resilient',
  '4C': 'Very tight coils, incredibly versatile',
};

// GET /api/hair?type=4C&porosity=high&goals=moisture,growth
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const type = (params.get('type') || '3A').toUpperCase();
  const porosity = (params.get('porosity') || 'unsure').toLowerCase();
  const goals = params.get('goals')?.split(',').filter(Boolean) || [];

  const group = type.charAt(0);

  return NextResponse.json({
    hairType: type,
    porosity,
    goals,
    description: DESCRIPTIONS[type] || 'Your personalised profile is ready.',
    routine: ROUTINES[group] || ROUTINES['3'],
    styles: STYLES[type] || STYLES[group + 'A'] || [],
    porosityTip: POROSITY[porosity] || POROSITY['unsure'],
  });
}
