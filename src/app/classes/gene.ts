import {ScaleLinear} from 'd3-scale';
import {Exon} from './interfaces';
import * as d3 from 'd3';

export class Gene {
  start: number;
  end: number;
  size: number;
  symbol: string;
  id: string;
  chr: string;
  homologIDs: Array<number>;
  strand: string;
  type: string;
  blockID: string;
  transcript: Array<Exon>;

  highlighted: boolean = false;
  selected: boolean = false;
  filtered: boolean = false;

  format: Function = d3.format(',');

  constructor(gene: any, ids: Array<number>, selected: boolean, block: string = null) {
    this.start = (gene.start_pos) ? gene.start_pos : gene.gene_start_pos;
    this.end = (gene.end_pos) ? gene.end_pos : gene.gene_end_pos;
    this.size = this.end - this.start;
    this.symbol = gene.gene_symbol;
    this.id = gene.gene_id;
    this.chr = gene.gene_chr;
    this.strand = (gene.strand) ? gene.strand : gene.gene_strand;
    this.type = gene.type;

    this.homologIDs = ids;
    this.blockID = (block) ? block : null;
    this.selected = selected;

    let t = gene.canonical_transcript.map(t => `${t.start_pos}-${t.end_pos}`);
    let newT: Array<string> = Array.from(new Set(t));
    this.transcript = newT.map(t => {
      let coords = t.split('-');
      return { start: Number(coords[0]), end: Number(coords[1])};
    })

  }

  /**
   * Marks the gene as a highlighted gene (indicates it's being hovered over)
   */
  highlight(): void { this.highlighted = true; }

  /**
   * Marks the gene as a non-highlighed gene
   */
  unhighlight(): void { this.highlighted = false; }

  /**
   * Marks the gene as a selected gene (from the feature search)
   */
  select(): void { this.selected = true; }

  /**
   * Marks the gene as a non-selected gene
   */
  deselect(): void { this.selected = false; }

  /**
   * Marks the gene as a filtered gene (passes the filtration functions)
   */
  filter(): void { this.filtered = true; }

  /**
   * Marks the gene as an unfiltered gene
   */
  unfilter(): void { this.filtered = false; }

  /**
   * Returns true/false if the gene is located in a syntenic region
   */
  isSyntenic(): boolean { return !(!this.blockID); }

  /**
   * Returns true/false if any of the status flags are true; essentially, if the gene has a color, it should have a label
   */
  hasVisibleLabel(): boolean { return this.highlighted || this.selected || this.filtered; }

  /**
   * Returns an X position (in px) for the gene, using the specified scale and start (if provided, indicating a comparison gene)
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the position
   * @param {number} start - if specified, use instead of the real start (used for comparison genes)
   */
  getXPos(scale: ScaleLinear<number, number>, start: number = null): number { return scale((start) ? start : this.start); }

  /**
   * Returns a central X position (in px) for the gene using the specified scale
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the position
   */
  getCenterXPos(scale: ScaleLinear<number, number>): number { return scale(this.start + (this.size / 2 )); }

  /**
   * Returns a Y position (in px) based on genomic location (used to reduce overlap of genes in the tracks)
   * @param {number} trackHeight - the height of the genomic track (the amount of vertical space)
   */
  getYPos(trackHeight: number): number {
    // 1.11 gets us close enough to edges without any elements overflowing
    let range = trackHeight / 1.11;
    // 1.13 pushes all elements down slightly to accomodate for the labels
    let offset = (((this.start % 1000) / 1000) * range) - range / 1.13;

    return ((trackHeight - 10) / 1.12 + offset) + 6;
  }

  /**
   * Returns a width (in px) for the gene using the specified scale
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the position
   */
  getWidth(scale: ScaleLinear<number, number>): number { return Math.abs(scale(this.end) - scale(this.start)); }

  /**
   * Returns the width (in px) of the specified exon using the specified scale
   * @param {Exon} exon - the exon to calculate the width for
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the width of the specified exon
   */
  getExonWidth(exon: Exon, scale: ScaleLinear<number, number>): number { return Math.abs(scale(exon.end) - scale(exon.start)); }

  /**
   * Returns an X position (in px) for the specified exon, using the specified scale and gene start position
   * @param {Exon} exon - the exon to calculate the X position for
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the position
   * @param {number} geneStart - the (visual) starting position of the comparison gene
   */
  getCompExonXPos(exon: Exon, scale: ScaleLinear<number, number>, geneStart: number): number {
    return (geneStart === this.start) ? Math.abs(scale(exon.start) - scale(geneStart)) : Math.abs(scale(geneStart) - scale(exon.end));
  }

  /**
   * Returns the X position (in px) of the specified exon using the specified scale
   * @param {Exon} exon - the exon to calculate the width for
   * @param {ScaleLinear<number, number>} scale - the scale to use to calculate the width of the specified exon
   */
  getRefExonXPos(exon: Exon, scale: ScaleLinear<number, number>): number { return Math.abs(scale(exon.start) - scale(this.start)); }

  /**
   * Returns the appropriate color of the gene, depending on the status flag states; order is important:
   * 1. We must check if the gene is being hovered over (highlighted) which should override selection/filtration status
   * 2. Selection is typically done before any filtering so we don't want to overwrite selection status
   * 3. Last resort to keep from it being colored black
   */
  getColor(): string {
    if(this.highlighted) {
      return '#080';
    } else if(this.selected) {
      return '#F00';
    } else if(this.filtered) {
      return '#00F';
    } else {
      return '#000';
    }
  }

  getTooltipGeneData(): object {
    return {
      'Gene ID': this.id,
      'Location': `${this.format(this.start)}bp - ${this.format(this.end)}bp`,
      '# of Homologs': this.homologIDs.length,
      'Strand': this.strand
    }
  }


}
