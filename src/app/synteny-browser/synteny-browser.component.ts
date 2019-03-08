import { ApiService } from './services/api.service';
import { BlockViewBrowserComponent } from './block-view-browser/block-view-browser.component';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FeatureSelectionComponent } from './feature-selection/feature-selection.component';
import { FilterComponent } from './filter/filter.component';
import { GenomeViewComponent } from './genome-view/genome-view.component';
import { Metadata } from './classes/interfaces';
import { Species } from './classes/species';
import { SpeciesSelectionComponent } from './species-selection/species-selection.component';

@Component({
  selector: 'app-synteny-browser',
  templateUrl: './synteny-browser.component.html'
})

export class SyntenyBrowserComponent implements OnInit {
  @ViewChild(SpeciesSelectionComponent) species: SpeciesSelectionComponent;
  @ViewChild(FeatureSelectionComponent) features: FeatureSelectionComponent;
  @ViewChild(GenomeViewComponent) genomeView: GenomeViewComponent;
  @ViewChild(BlockViewBrowserComponent) blockView: BlockViewBrowserComponent;
  @ViewChild(FilterComponent) filters: FilterComponent;

  refSpecies: Species;
  compSpecies: Species;
  genomeColors: any;

  viewInBrowser: boolean = false;

  filterOpen: boolean = false;
  filterConditions: Array<any> = [];

  constructor(private http: ApiService, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // get the color map for genomes
    this.http.getGenomeColorMap().subscribe(colors => {
      this.genomeColors = colors;

      // get available species from the API
      this.http.getSpecies().subscribe(species => {
        // create species for species and pass them to the selection component
        this.species.setSpecies(species.map(id => new Species(id)));

        this.updateSpecies();
      });
    });
  }


  // Operational Methods

  /**
   * Updates reference and comparison species with the most recent selections,
   * loads the feature search with features for the reference species and
   * renders the genome view with the updated reference and comparison species
   */
  updateSpecies(): void {
    // update the species
    this.refSpecies = this.species.getReferenceSelection();
    this.compSpecies = this.species.getComparisonSelection();

    // allow the species selects to stabilize
    this.cdr.detectChanges();

    // load the feature selection using the most recent reference species
    this.features.load(this.refSpecies);

    // render the genome view for the new selections
    this.genomeView.render(this.refSpecies, this.compSpecies, this.genomeColors);

    // TODO: Remove after filter implementation is finished
    this.cdr.detectChanges();

    setTimeout(() => {
      this.genomeView.renderChordMapForChr('16');
      this.getChromosomeFeatures();
    }, 1500);
    setTimeout(() => {
      this.filterOpen = true;
    }, 3000);

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
    let features = this.genomeView.getChromosomeFeaturesToView();

    // allow the block view synteny-browser to initialize
    this.cdr.detectChanges();
    this.blockView.render(this.refSpecies,
                          this.compSpecies,
                          this.genomeColors,
                          features.chr,
                          features.features);

    setTimeout(() => {
      // TODO: this currently only will work in Firefox and Chrome
      document.getElementById('block-view')
              .scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
  }

  /**
   * Updates the block view with the most recent filter conditions
   */
  getFilters(): void {
    this.filterOpen = false;
    this.filterConditions = this.filters.filters;
    this.blockView.applyFilterConditions(this.filterConditions);
  }
}
