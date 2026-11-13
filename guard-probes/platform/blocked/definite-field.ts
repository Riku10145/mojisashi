// stopped-by: no-restricted-syntax
class Draft {
  text!: string;

  length(): number {
    return this.text.length;
  }
}

export const draft = new Draft();
