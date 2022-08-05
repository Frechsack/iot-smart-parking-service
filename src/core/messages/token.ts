export class Token {
  constructor(private readonly value: string | undefined){}

  public isEmpty(): boolean {
    return this.value === undefined;
  }

  public isPresent(): boolean {
    return this.value !== undefined;
  }

  public toString(): string {
    if(this.isEmpty()) throw new Error('empty');
    return this.value!;
  }

  public toNumber(): number {
    if(this.isEmpty()) throw new Error('empty');
    return Number.parseFloat(this.value!);
  }

  public toBoolean(): boolean {
    if(this.isEmpty()) throw new Error('empty');
    if(this.value!.toLowerCase() === 'false')
      return false;
    if(this.value!.toLowerCase() === 'true')
      return true;
    throw new Error('Not a boolean');
  }

  public static parseTokens(message: string, length: number = 0): Token[] {
    const elements = message.split(':');
    const target: Token[] = [];

    for(let element of elements){
      element = element.trim();
      const elementLowerCase = element.toLowerCase();
      // Prüfe ob gültiges element
      if(element === '' || elementLowerCase === 'null' || elementLowerCase === 'undefined')
        target.push(new Token(undefined));
      else {
        target.push(new Token(element.trim()));
      }
    }
    while (target.length < length)
      target.push(new Token(undefined));
      
    return target;
  }
}
