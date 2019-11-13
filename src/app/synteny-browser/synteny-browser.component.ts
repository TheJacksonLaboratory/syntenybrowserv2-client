import { ApiService } from './services/api.service';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { BlockViewFilterComponent } from './block-view-filter/block-view-filter.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { Species } from './classes/species';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';
import { Filter } from './classes/filter';
import { DataStorageService } from './services/data-storage.service';

@Component({
  selector: 'app-synteny-browser',
  templateUrl: './synteny-browser.component.html'
})

export class SyntenyBrowserComponent implements OnInit {
  @ViewChild(SpeciesSelectionComponent, {static: true}) species: SpeciesSelectionComponent;
  @ViewChild(FeatureSelectionComponent, {static: true}) features: FeatureSelectionComponent;
  @ViewChild(GenomeViewComponent, {static: true}) genomeView: GenomeViewComponent;
  @ViewChild(BlockViewBrowserComponent, {static: false}) blockViewBrowser: BlockViewBrowserComponent;
  @ViewChild(BlockViewFilterComponent, {static: false}) blockViewFilters: BlockViewFilterComponent;

  viewInBrowser: boolean = false;
  filterOpen: boolean = false;

  constructor(public data: DataStorageService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    setTimeout(() => {
      // have the species selection
      this.species.getSpecies();
      this.updateSpecies();
    }, 200);
  }


  // Operational Methods

  /**
   * Updates reference and comparison species with the most recent selections,
   * loads the feature search with features for the reference species and
   * renders the genome view with the updated reference and comparison species
   */
  updateSpecies(): void {
    this.viewInBrowser = false;

    // update the species
    this.data.refSpecies = this.species.getReferenceSelection();
    this.data.compSpecies = this.species.getComparisonSelection();

    // allow the species selects to stabilize
    this.cdr.detectChanges();

    // render the genome view for the new selections
    this.genomeView.render();

    // load the feature selection using the most recent reference species
    this.features.load();

    this.data.getOntologyTerms();

    // TODO: this is here for work on filters
    // this.automateFlowToWorkOnFilters();
  }

  /**
   * Updates the genome view with the current selections from the feature search
   */
  updateFeatures(): void {
    this.genomeView.updateFeatures(this.features.selections);
  }


  // Getter Methods

  /**
   * Show the block view browser and pass the reference and comparison species,
   * color dictionary, selected chromosome, and the features in the selected
   * chromosome (if any) to the block view browser
   */
  getChromosomeFeatures() {
    // show block view synteny-browser
    this.viewInBrowser = true;

    // get the list of features (if any) for the selected chromosome
    this.genomeView.setChromosomeFeaturesToView();

    // allow the block view synteny-browser to initialize
    this.cdr.detectChanges();

    this.blockViewBrowser.render();

    setTimeout(() => {
      // TODO: this currently only will work in Firefox and Chrome
      document.getElementById('block-view')
              .scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }

  /**
   * Updates the block view with the most recent filter conditions
   */
  getFilters(): void {
    let bvb = this.blockViewBrowser;
    let bvf = this.blockViewFilters;

    this.data.filters = bvf.getCreatedFilters();
    bvb.filters = this.data.filters;

    const filteredGenes = bvf.filteredGenes.filter(g => g.filtered);
    bvb.filteredRefGenes = filteredGenes.filter(g => g.species === 'ref');
    bvb.filteredCompGenes = filteredGenes.filter(g => g.species === 'comp');

    this.filterOpen = false;
  }

  /**
   * Temporary automated helper method to get to the filter dialog quickly
   */
  private automateFlowToWorkOnFilters(): void {
    setTimeout(() => {
      this.genomeView.renderChordMapForChr('14');
      this.getChromosomeFeatures();

      this.filterOpen = true;
    }, 300);
  }
}
