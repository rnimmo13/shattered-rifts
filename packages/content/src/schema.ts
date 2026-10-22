// zod schemas mirroring the engine's card / effect-DSL types (packages/engine/src/types.ts).
// Content tests validate every card against these, so a typo in data fails CI, not a game.

import { z } from 'zod';
import type { Effect } from '@sr/engine';

export const KeywordSchema = z.enum([
  'guardian',
  'blitz',
  'shield',
  'ward',
  'pierce',
  'lifebind',
  'veiled',
  'stun',
  'corrode',
  'ambush',
  'devour',
  'evolve',
  'assemble',
  'overclock',
  'resonance',
  'echo',
  'ascend',
  'scry',
  'swift',
  'quick',
  'negate',
  'charges',
]);

const CardTypeSchema = z.enum(['unit', 'spell', 'trap', 'relic', 'rift', 'token', 'sigil']);
const SideSchema = z.enum(['friendly', 'enemy', 'any']);
const ZoneSchema = z.enum(['units', 'backrow', 'setCards', 'relics']);

export const FilterSchema = z.strictObject({
  type: z.union([CardTypeSchema, z.array(CardTypeSchema)]).optional(),
  tribe: z.string().optional(),
  minCost: z.number().int().optional(),
  maxCost: z.number().int().optional(),
  minPower: z.number().int().optional(),
  maxPower: z.number().int().optional(),
  maxGuard: z.number().int().optional(),
  keyword: KeywordSchema.optional(),
  damaged: z.boolean().optional(),
  notSelf: z.boolean().optional(),
  withoutShield: z.boolean().optional(),
  sameNameAsEventSource: z.boolean().optional(),
});

export const TargetSchema = z.strictObject({
  pick: z.enum([
    'chosen',
    'random',
    'all',
    'self',
    'eventSource',
    'eventTarget',
    'riftwalker',
    'linkTarget',
    'summonedByThis',
  ]),
  side: SideSchema.optional(),
  zone: z.union([ZoneSchema, z.array(ZoneSchema)]).optional(),
  filter: FilterSchema.optional(),
  count: z.number().int().positive().optional(),
  slot: z.number().int().nonnegative().optional(),
});

const AmountSchema = z.union([
  z.number().int(),
  z.strictObject({
    countOf: TargetSchema,
    times: z.number().int().optional(),
    plus: z.number().int().optional(),
  }),
  z.strictObject({
    powerOf: TargetSchema,
    times: z.number().int().optional(),
    plus: z.number().int().optional(),
  }),
]);

const RealmSchema = z.enum(['aurelion', 'nexus', 'wyldmaw', 'umbral', 'neutral']);

const ConditionSchema = z.strictObject({
  targetIsAttacking: z.boolean().optional(),
  slot: z.number().int().optional(),
  eventSource: FilterSchema.optional(),
  resonanceAtLeast: z.number().int().optional(),
  handCountAtMost: z.number().int().optional(),
});

const PlayerRef = z.enum(['self', 'enemy']);

export const EffectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.union([
    z.strictObject({ op: z.enum(['damage', 'heal']), target: TargetSchema, amount: AmountSchema }),
    z.strictObject({
      op: z.literal('destroy'),
      target: TargetSchema,
      devour: z.boolean().optional(),
    }),
    z.strictObject({
      op: z.enum(['banish', 'returnToHand', 'stun', 'corrode', 'assemble']),
      target: TargetSchema,
    }),
    z.strictObject({
      op: z.literal('takeControl'),
      target: TargetSchema,
      duration: z.enum(['turn', 'permanent']).optional(),
      grant: z
        .strictObject({ keyword: KeywordSchema, duration: z.enum(['turn', 'permanent']) })
        .optional(),
    }),
    z.strictObject({
      op: z.literal('buff'),
      target: TargetSchema,
      power: AmountSchema.optional(),
      guard: AmountSchema.optional(),
      duration: z.enum(['turn', 'permanent']),
    }),
    z.strictObject({
      op: z.literal('grant'),
      target: TargetSchema,
      keyword: KeywordSchema,
      duration: z.enum(['turn', 'permanent']),
    }),
    z.strictObject({
      op: z.literal('summon'),
      card: z.string(),
      count: z.number().int().positive(),
      side: z.enum(['friendly', 'enemy']).optional(),
    }),
    z.strictObject({
      op: z.enum(['draw', 'discardRandom', 'scry', 'gainAether', 'topdeckFromHand']),
      player: PlayerRef,
      amount: z.number().int().positive(),
      temporary: z.boolean().optional(),
    }),
    z.strictObject({ op: z.literal('negate'), link: z.literal('trigger') }),
    z.strictObject({ op: z.literal('fight'), a: TargetSchema, b: TargetSchema }),
    z.strictObject({ op: z.literal('transform'), target: TargetSchema, into: z.string() }),
    z.strictObject({
      op: z.literal('setFrom'),
      zone: z.literal('deck'),
      filter: FilterSchema.optional(),
      choose: z.literal('random'),
      free: z.literal(true),
    }),
    z.strictObject({
      op: z.literal('removeCharge'),
      target: TargetSchema,
      amount: z.number().int().positive().optional(),
    }),
    z.strictObject({
      op: z.literal('addRandomToHand'),
      player: PlayerRef,
      realm: RealmSchema,
      cardType: CardTypeSchema,
    }),
    z.strictObject({
      op: z.literal('setTrapFrom'),
      zone: z.enum(['hand', 'deckTop']),
      n: z.number().int().positive().optional(),
    }),
    z.strictObject({ op: z.literal('peekDestroy'), filter: FilterSchema.optional() }),
    z.strictObject({
      op: z.literal('copySpell'),
      which: z.enum(['lastCast', 'eachDifferentInVoid']),
      targets: z.enum(['choose', 'random']),
    }),
    z.strictObject({ op: z.literal('redirect'), link: z.literal('trigger') }),
    z.strictObject({ op: z.literal('revealHand'), player: PlayerRef }),
    z.strictObject({ op: z.literal('resetSelf') }),
    z.strictObject({ op: z.literal('atEndOfTurn'), effects: z.array(EffectSchema) }),
    z.strictObject({
      op: z.literal('conditional'),
      if: ConditionSchema,
      then: z.array(EffectSchema),
      else: z.array(EffectSchema).optional(),
    }),
  ]),
) as z.ZodType<Effect>;

const EventFilterSchema = z.strictObject({
  type: z.enum([
    'attackDeclared',
    'unitSummoned',
    'spellCast',
    'swiftCast',
    'trapActivated',
    'unitDied',
    'devoured',
    'trapResolved',
    'shieldPopped',
    'assembled',
  ]),
  side: SideSchema,
  filter: FilterSchema.optional(),
  attackTarget: z.enum(['friendlyUnit', 'riftwalker']).optional(),
  killedBySelf: z.boolean().optional(),
  cause: z.literal('combat').optional(),
  onSelf: z.boolean().optional(),
  spellTargets: z.literal('friendlyUnit').optional(),
});
const EventSpec = z.union([EventFilterSchema, z.array(EventFilterSchema).min(1)]);

const StaticModifierSchema = z.union([
  z.strictObject({ type: z.literal('cantAttack') }),
  z.strictObject({
    type: z.literal('costMod'),
    side: SideSchema,
    filter: FilterSchema,
    amount: z.number().int(),
    on: z.enum(['play', 'activate']),
    firstEachTurn: z.boolean().optional(),
  }),
  z.strictObject({
    type: z.literal('selfCost'),
    per: z.enum(['backrowCards', 'voidTypes']),
    amount: z.number().int(),
  }),
  z.strictObject({ type: z.literal('damageReduction'), amount: z.number().int().positive() }),
  z.strictObject({ type: z.literal('backrowSlots'), total: z.number().int().positive() }),
  z.strictObject({ type: z.literal('trapsReady') }),
  z.strictObject({ type: z.literal('protectSetCards') }),
  z.strictObject({
    type: z.literal('powerPerCount'),
    count: z.strictObject({ side: SideSchema, filter: FilterSchema }),
    amount: z.number().int(),
  }),
  z.strictObject({
    type: z.literal('aura'),
    side: SideSchema,
    filter: FilterSchema.optional(),
    power: z.number().int().optional(),
    guard: z.number().int().optional(),
    keyword: KeywordSchema.optional(),
  }),
]);

export const AbilitySchema = z.union([
  z.strictObject({
    kind: z.enum([
      'onResolve',
      'onSummon',
      'onDeath',
      'onFlip',
      'onDevoured',
      'startOfTurn',
      'endOfTurn',
      'duelStart',
      'onBreak',
    ]),
    effects: z.array(EffectSchema),
    resonance: z
      .strictObject({ n: z.number().int().positive(), effects: z.array(EffectSchema) })
      .optional(),
    optional: z.boolean().optional(),
    overclock: z.boolean().optional(),
  }),
  z.strictObject({
    kind: z.literal('whenever'),
    event: EventSpec,
    effects: z.array(EffectSchema),
    oncePerTurn: z.boolean().optional(),
    oncePerGame: z.boolean().optional(),
  }),
  z.strictObject({ kind: z.literal('trigger'), event: EventSpec, effects: z.array(EffectSchema) }),
  z.strictObject({
    kind: z.literal('activated'),
    quick: z.boolean().optional(),
    cost: z.number().int().nonnegative(),
    oncePerTurn: z.boolean().optional(),
    effects: z.array(EffectSchema),
  }),
  z.strictObject({ kind: z.literal('static'), modifier: StaticModifierSchema }),
]);

export const CardIdSchema = z.string().regex(/^(AUR|NEX|WYL|UMB|NEU|TOK|SIG)-[A-Z0-9]+$/);

export const CardDefSchema = z
  .strictObject({
    id: CardIdSchema,
    name: z.string().min(1),
    realm: z.enum(['aurelion', 'nexus', 'wyldmaw', 'umbral', 'neutral']),
    type: CardTypeSchema,
    rarity: z.enum(['common', 'rare', 'epic', 'legendary', 'mythic']),
    cost: z.number().int().min(0).max(10),
    power: z.number().int().min(0).optional(),
    guard: z.number().int().min(1).optional(),
    tribes: z.array(z.string()).optional(),
    keywords: z.array(KeywordSchema).optional(),
    params: z
      .strictObject({
        overclock: z.number().int().positive().optional(),
        echo: z.number().int().positive().optional(),
        charges: z.number().int().positive().optional(),
        ambush: z.literal(true).optional(),
      })
      .optional(),
    ascend: z
      .strictObject({ destroy: z.number().int().positive(), filter: FilterSchema.optional() })
      .optional(),
    abilities: z.array(AbilitySchema),
    text: z.string(),
    flavor: z.string().optional(),
    art: z
      .strictObject({
        file: z.string().optional(),
        prompt: z.string(),
        focal: z.tuple([z.number(), z.number()]).optional(),
      })
      .optional(),
    collectible: z.boolean(),
    source: z.string().optional(),
  })
  .superRefine((c, ctx) => {
    const isUnit = c.type === 'unit' || c.type === 'token';
    if (isUnit && (c.power === undefined || c.guard === undefined)) {
      ctx.addIssue({ code: 'custom', message: `${c.id}: units need power and guard` });
    }
    if (!isUnit && (c.power !== undefined || c.guard !== undefined)) {
      ctx.addIssue({ code: 'custom', message: `${c.id}: only units have power/guard` });
    }
    if (c.type === 'token' && c.collectible)
      ctx.addIssue({ code: 'custom', message: `${c.id}: tokens are not collectible` });
  });
