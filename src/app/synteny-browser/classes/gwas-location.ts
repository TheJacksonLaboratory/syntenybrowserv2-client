import { format, ScaleLinear } from 'd3';

export class GWASLocation {
  // genomic location
  location: number;

  // location ID
  id: string;

  // chromosome the hit is located in
  chr: string;

  // ID of the block the is located in
  blockID: string;

  // ID of species
  taxonID: number;

  hits: GWASHit[];

  // formatting function from d3 that adds commas to large numbers to help with
  // readability
  format: Function = format(',');

  // used when app queries list of features which contain a mix of genes and QTLs
  isGene = false;

  // used when app queries list of features which contain a mix of genes and
  // QTLs and GWASLocations
  isQTL = false;

  constructor(hits: GWASHit[]) {
    this.location = hits[0].position;
    this.id = `${hits[0].chr}_${hits[0].position}`;
    this.chr = hits[0].chr;
    this.taxonID = hits[0].taxon_id;
    this.blockID = hits[0].blockID || null;
    this.hits = hits;
  }

  /**
   * Returns the data to be displayed in a tooltip
   */
  getTooltipData(): any {
    return {
      chr: this.chr,
      loc: this.format(this.location),
      numHits: this.hits.length,
      hits: this.hits.map(h => this.getHitDataForTooltip(h)),
    };
  }

  /**
   * Returns the content for a click tooltip for the location
   */
  getClicktipData(): any {
    return {
      chr: this.chr,
      loc: this.format(this.location),
      numHits: this.hits.length,
      hits: this.hits.map(h => this.getHitDataForTooltip(h, true)),
    };
  }

  /**
   * Returns the scaled x position for the reference location (in px)
   * @param {ScaleLinear<number, number>} scale - scale to use to get position
   */
  getXPos(scale: ScaleLinear<number, number>): number {
    return scale(this.location);
  }

  /**
   * Returns data for the specified GWAS hit; if detailed is true, then it will
   * return more info on the hit (this is for the case of a clicktip/dialog popup)
   * @param {GWASHit} hit - the hit to get data for
   * @param {boolean} detailed - if the returned object should contain all
   *                             available info (default false)
   */
  private getHitDataForTooltip(hit: GWASHit, detailed = false): any {
    let data = {
      id: hit.id,
      quality: hit.quality,
      frequency: hit.frequency,
      gene: hit.gene,
    };

    if (detailed) {
      data['refBase'] = hit.ref_base;
      data['altAllele'] = hit.alt_allele;
      data['filter'] = hit.filter;
    }
    return data;
  }
}

export interface GWASHit {
  id: any;
  chr: string;
  position: number;
  ref_base: any;
  alt_allele: any;
  quality: any;
  filter: any;
  frequency: any;
  gene: string;
  trait_id: string;
  taxon_id: number;
  blockID?: string;
}
