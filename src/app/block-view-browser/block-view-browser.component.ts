import { Component, OnInit } from '@angular/core';
import {Species} from '../classes/species';
import {ApiService} from '../services/api.service';
import * as d3 from 'd3';
import {BrowserInterval, Gene, SyntenyBlock} from '../classes/interfaces';

@Component({
  selector: 'app-block-view-browser',
  templateUrl: './block-view-browser.component.html',
  styleUrls: ['./block-view-browser.component.scss']
})
export class BlockViewBrowserComponent implements OnInit {
  reference: Species;
  comparison: Species;
  genomeColors: any;

  chromosome: string;
  selectedFeatures: Array<string>;

  width: number = 1200;
  height: number = 500;
  chromosomeViewHeight = 80;
  browserOffset = 175;
  trackHeight = 100;

  interval: BrowserInterval;
  blocks: Array<SyntenyBlock>;
  referenceGenes: Array<any>;
  comparisonGenes: Array<any>;
  refBPToPixels: any;
  compBPToPixels: any = {
    match_orientation: {},
    true_orientation: {}
  };
  blockOrientation: string = 'match_orientation';


  constructor(private http: ApiService) { }

  ngOnInit() { }

  render(reference: Species, comparison: Species, genomeColors: any, chr: string, features: Array<string>): void {
    this.reference = reference;
    this.comparison = comparison;
    this.genomeColors = genomeColors;

    this.chromosome = chr;
    this.selectedFeatures = features;

    // set the range maxto 'width - 1' to keep the last tick line from hiding on the right side of the svg
    this.refBPToPixels = d3.scaleLinear()
                        .domain([0, this.reference.genome[this.chromosome]])
                        .range([0, this.width - 1]);

    this.http.getChromosomeSynteny(reference.getID(), comparison.getID(), chr).subscribe(blocks => {
      this.blocks = blocks.map(block => {
        return {
          ref_chr: block.ref_chr,
          ref_start: block.ref_start,
          ref_end: block.ref_end,
          comp_chr: block.comp_chr,
          orientation_matches: block.orientation_matches,
          match_orientation: {
            comp_start: (block.orientation_matches) ? block.comp_start : block.comp_end,
            comp_end: (block.orientation_matches) ? block.comp_end : block.comp_start
          },
          true_orientation: {
            comp_start: block.comp_start,
            comp_end: block.comp_end
          },
          id: block.id
        }
      });

      this.createCompBPToPixelsScales();

      this.setInterval(0, this.reference.genome[this.chromosome]);
      this.renderChromosomeView();

      this.http.getGenes(reference.getID(),comparison.getID(), chr).subscribe(genes => {
        this.referenceGenes = genes.map((gene, i) => {
          if(gene.homologs.length === 0) {
            delete gene.homologs;
          } else {
            gene['homolog_id'] = i;
          }

          return gene;
        });

        this.comparisonGenes = [].concat.apply([], this.referenceGenes.filter(gene => gene.homologs)
                      .map(gene => {
                        let homs = gene.homologs.map(g => {
                          g['homolog_id'] = gene.homolog_id;

                          let block = this.determineBlockForGene(g);
                          if(block) {
                            g['block_id'] = block;
                          }

                          return g;
                        });

                          return homs;
                      })).filter(gene => gene.block_id);

        d3.select('#browser').call(d3.zoom()
                                     .scaleExtent([1, Infinity])
                                     .translateExtent([[0, 0], [this.width, this.height]])
                                     .extent([[0, 0], [this.width, this.height]]).on('zoom', this.zoom)
        )
      });
    });
  }

  renderChromosomeView(): void {
    // create the axis
    d3.select('.axis')
      .call(d3.axisBottom(this.refBPToPixels) // the scale to use
              .tickValues(this.getAxisTickValues(this.chromosome)) // tick values to use
              .tickFormat((d) => Math.round(d / 1000000).toString() + " Mb")) // format for tick labels
      .selectAll('text')
        .attr('text-anchor', (d, i) => this.getAxisTickLabelPosition(i)); // set positional attr for tick labels

  }

  private getAxisTickValues(chr: string) {
    let total = this.reference.genome[chr];
    let values = [];

    // add all but the last interval values to the list
    // total - 2 ensures the final tick isn't added by rounding error
    for(let i = 0; i < total - 2; i += total / 10) {
      values.push(Math.round(i));
    }

    values.push(total);

    return values;
  }

  private getAxisTickLabelPosition(index: number): string {
    if(index === 0) {
      return 'start';
    } else if(index === 10) {
      return 'end';
    } else {
      return 'middle';
    }
  }

  /**
   * Returns a color value that is the same as the hex, but at the specified opacity
   *
   * @param {string} hex - hex color value
   * @param {number} opacity - opacity decimal for the faded color
   * @return {string} - faded color value in rgba form
   */
  fadeColor = function(hex, opacity): string {
    let color;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      color = hex.substring(1).split("");
      if(color.length === 3){
        color = [color[0], color[0], color[1], color[1], color[2], color[2]];
      }
      color= "0x"+color.join("");
      return "rgba("+[(color>>16)&255, (color>>8)&255, color&255].join(",")+"," + opacity +")";
    }
    throw new Error("Bad Hex");
  };

  private setInterval(start: number, end: number): void {
    this.interval = {
      start: start,
      end: end,
      width: end - start
    }
  }

  getRefChrSize() {
    return this.reference.genome[this.chromosome];
  }

  getNonMatchedBlocks(): Array<SyntenyBlock> {
    return this.blocks.filter(block => block.orientation_matches)
  }

  getOrientationIndPathCommand(block: SyntenyBlock): string {
    return 'M ' + this.refBPToPixels(block.ref_start) + ', ' + this.trackHeight +
           ' L ' + this.refBPToPixels(block.ref_end) + ', ' + (this.trackHeight + 50) +
           ' M ' + this.refBPToPixels(block.ref_end) + ', ' + (this.trackHeight) +
           ' L ' + this.refBPToPixels(block.ref_start) + ', ' + (this.trackHeight + 50) +
           ' Z';
  }

  jitter(bp: number): number {
    if(this.trackHeight === 0) {
      return 0;
    }

    // 1.12 gets us close enough to edges without any elements overflowing
    let range = this.trackHeight / 1.12;
    // 1.13 pushes all elements down slightly to accomodate for the labels
    let offset = (((bp % 1000) / 1000) * range) - range / 1.13;

    return ((this.trackHeight - 10) / 1.12 + offset);
  }

  createCompBPToPixelsScales(): void {
    this.blocks.forEach(block => {
      this.compBPToPixels.match_orientation[block.id] = d3.scaleLinear()
                                                     .domain([block.match_orientation.comp_start, block.match_orientation.comp_end])
                                                     .range([this.refBPToPixels(block.ref_start), this.refBPToPixels(block.ref_end)]);

      this.compBPToPixels.true_orientation[block.id] = d3.scaleLinear()
                                                    .domain([block.true_orientation.comp_start, block.true_orientation.comp_end])
                                                    .range([this.refBPToPixels(block.ref_start), this.refBPToPixels(block.ref_end)]);
    });

    //console.log(this.compBPToPixels.match_orientation['SynBlock:mmhs:1001_1'](1));
  }

  determineBlockForGene(gene: Gene): string {
    let block = this.blocks.filter(block => block.comp_chr === gene.gene_chr && this.isInBlock(gene, block));
    return (block.length > 0) ? block[0].id : null;
  }

  private isInBlock(gene: Gene, block: SyntenyBlock): boolean {
    return (gene.gene_start_pos >= block.true_orientation.comp_start && gene.gene_start_pos <= block.true_orientation.comp_end) ||
      (gene.gene_end_pos <= block.true_orientation.comp_end && gene.gene_end_pos >= block.true_orientation.comp_start)
  }

  getCompWidth(gene: Gene): number {
    return Math.abs(this.compBPToPixels[this.blockOrientation][gene.block_id](gene.gene_end_pos) - this.compBPToPixels[this.blockOrientation][gene.block_id](gene.gene_start_pos));
  }

  getCompX(gene: Gene): number {
    let start = (this.blocks.filter(block => block.id === gene.block_id)[0].orientation_matches) ? gene.gene_start_pos : gene.gene_end_pos;
    return this.compBPToPixels[this.blockOrientation][gene.block_id](start);
  }

  private zoom(): void {
    console.log('zooming');
  }

}
