export class Feature {
  id: string;
  symbol: string;
  chr: string;
  start: number;
  end: number;
  type: string;
  gene: boolean;

  term: string;
  termID: string;

  selected: boolean = false;

  constructor(feature: any, assocMode = false) {
    if(feature.gene_id) {
      this.id = feature.gene_id;
      this.symbol = feature.gene_symbol;
      this.gene = true;
      this.type = feature.gene_type;
    } else {
      this.id = feature.qtl_id;
      this.symbol = feature.qtl_symbol;
      this.gene = false;
      this.type = 'QTL';
    }

    this.chr = feature.chr;
    this.start = feature.start;
    this.end = feature.end;

    if(assocMode) {
      this.term = feature.term_name;
      this.termID = feature.term_id;
    }
  }


  //Operational Methods

  /**
   * Sets the selected flag to false (deselects the current feature)
   */
  deselect(): void { this.selected = false; }

  /**
   * Sets the selected flag to true (selects the current feature)
   */
  select(): void { this.selected = true; }


  // Condition Checks

  /**
   * Returns true/false if the feature's symbol *contains* the specified
   * search string
   * @param {string} search - the search string
   */
  matchesSearch(search: string): boolean {
    return this.symbol.toLowerCase().includes(search.toLowerCase());
  }

  /**
   * Returns true/false if the feature's symbol *is the same as* the
   * specified symbol
   * @param {string} symbol - the symbol to compare to
   */
  is(symbol: string): boolean {
    return this.symbol.toLowerCase() === symbol.toLowerCase();
  }
}
