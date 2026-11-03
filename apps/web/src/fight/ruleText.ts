// A Warden's rule split for the fight screen (WardenRule.tsx, DECISIONS #562): its name, which is all that shows once it is read,
// and the rest.

/** "The Veil: every move ..." is the name and the rest; a rule with no short name before a colon is just a Warden rule. */
export function splitRule(rule: string): { name: string; text: string } {
  const at = rule.indexOf(': ');
  if (at > 0 && at <= 40) return { name: rule.slice(0, at), text: rule.slice(at + 2) };
  return { name: 'Warden rule', text: rule };
}
