export class Feature {
  // ID for the feature
  id: string;

  // feature symbol
  symbol: string;

  // chromosome where the feature is located on
  chr: string;

  // genomic starting location of the feature
  start: number;

  // genomic end location of the feature
  end: number;

  // gene type or 'QTL'
  type: string;

  // used when app queries list of features which contain a mix of genes and QTLs
  isGene: boolean;

  // ontology term name the feature is associated with
  term: string;

  // ontology term ID the feature is associated with
  termID: string;

  // indicates if the feature has been selected
  selected = false;

  constructor(feature: any, assocMode = false) {
    this.id = feature.id;
    this.symbol = feature.symbol;
    this.isGene = feature.type.toLowerCase() !== 'qtl';
    this.type = feature.type;
    this.chr = feature.chr;
    this.start = feature.start;
    this.end = feature.end;

    if (assocMode) {
      this.term = feature.term_name;
      this.termID = feature.term_id;
    }
  }

  /**
   * Sets the selected flag to false (deselects the current feature)
   */
  deselect(): void {
    this.selected = false;
  }

  /**
   * Sets the selected flag to true (selects the current feature)
   */
  select(): void {
    this.selected = true;
  }

  /**
   * Returns true if the feature's symbol *is the same as* the
   * specified symbol
   * @param {string} symbol - the symbol to compare to
   */
  is(symbol: string): boolean {
    return this.symbol.toLowerCase() === symbol.toLowerCase();
  }
}
