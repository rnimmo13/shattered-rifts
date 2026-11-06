/** Keep each combatant’s chosen artwork stable; only a deliberate form change replaces it. */
export class FigureSession<T> {
  private readonly chosen = new Map<string, { form: string; value: T }>();
  get(id: string, form: string, load: () => T): T {
    const old = this.chosen.get(id);
    if (old?.form === form) return old.value;
    const value = load();
    this.chosen.set(id, { form, value });
    return value;
  }
}
