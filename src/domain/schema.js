const { z } = require('zod');
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const fieldValue = z.union([z.string().min(1).max(500), money, z.boolean(), z.null()]);
const update = z.object({ field: z.string().min(1).max(80), memberId: z.string().max(50).optional(), value: fieldValue,
  status: z.enum(['known','none','unknown']).default('known'), resolveConflict: z.boolean().default(false),
  normalization:z.object({amount_fen:money,period:z.enum(['month','year']),annual_fen:money}).strict().optional() }).strict();
const policy = z.object({ policy_id: z.string(), insured_member_id: z.string(), kind: z.enum(['term_life','medical','critical_illness','accident']),
  sum_insured_fen: money, source: z.enum(['personal','employer_group']), validity: z.enum(['valid','invalid','unknown']), evidence_id: z.string().nullable() }).strict();
const member = z.object({ member_id: z.string().regex(/^[a-zA-Z0-9_-]{1,50}$/), relation: z.enum(['self','spouse','child','parent','other']) }).strict();
module.exports = { z, money, update, policy, member, createSession: z.object({ mode:z.enum(['individual','family']), intent:z.enum(['plan','explain','compare']), jurisdiction:z.literal('CN'), privacyNoticeAccepted:z.literal(true) }).strict() };
