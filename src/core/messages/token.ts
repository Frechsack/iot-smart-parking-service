/**
* Ein Token ist eine einzelne sektion in einem Textblock, welcher durch ":" getrennt wird.
* Eine solche Sektion kann einen Wert beinhalten oder keinen.
* Dieses Objekt kann verwendet werden, um zu prüfen ob ein Wert vorhanden ist {@link this.isPresent()}, und wenn vorhanden ihn in einen Datentyp umzuwandeln {@link this.toNumber()}
*/
export class Token {
  /**
  * Der Wert innerhalb dieses Tokens.
  */
  constructor(private readonly value: string | undefined){}

  /**
  * Prüft ob der Token leer ist.
  */
  public isEmpty(): boolean {
    return this.value === undefined;
  }

  /**
  * Prüft ob dieser Token nicht leer ist.
  */
  public isPresent(): boolean {
    return this.value !== undefined;
  }

  /**
  * Gibt den Wert des Tokens als string zurück.
  */
  public toString(): string {
    if(this.isEmpty()) throw new Error('empty');
    return this.value!;
  }

  /**
  * Gibt den Wert des Tokens als Zahl zurück. Sollte keine Zahl gefunden werden, wird ein Fehler geworfen.
  */
  public toNumber(): number {
    if(this.isEmpty()) throw new Error('empty');
    const n = Number.parseFloat(this.value!);
    if(n == NaN) throw new Error('not a number');
    return n;

  }

  /**
  * Gibt den Wert des Tokens als boolean zurück. Sollte kein boolean gefunden werden, wird ein Fehler geworfen.
  */
  public toBoolean(): boolean {
    if(this.isEmpty()) throw new Error('empty');
    if(this.value!.toLowerCase() === 'false')
      return false;
    if(this.value!.toLowerCase() === 'true')
      return true;
    throw new Error('Not a boolean');
  }

  /**
  * Konvertiert eine Textnachricht in mehrere Tokens. Ein Token ist dabei eine durch ":" getrennte Sektion.
  * @param message Die zu konvertierende Textnachricht.
  * @param length Die mindestlänge an Tokens. Sollte die Textnachricht nicht soviele Tokens besitzen, werden leere Tokens nachgefüllt.
    Standartmäßig werden keine Tokens nachgefüllt.
  * @returns Gibt die Tokens zurück.
  */
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
