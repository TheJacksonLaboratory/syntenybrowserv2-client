import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Species } from '../classes/species';
import { SpeciesSelectionComponent } from '../species-selection/species-selection.component';
import { GenomeViewComponent } from '../genome-view/genome-view.component';
import { FeatureSelectionComponent } from '../feature-selection/feature-selection.component';
import { BlockViewBrowserComponent } from '../block-view-browser/block-view-browser.component';
import { Metadata } from '../classes/interfaces';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
  @ViewChild(SpeciesSelectionComponent) species: SpeciesSelectionComponent;
  @ViewChild(FeatureSelectionComponent) features: FeatureSelectionComponent;
  @ViewChild(GenomeViewComponent) genomeView: GenomeViewComponent;
  @ViewChild(BlockViewBrowserComponent) blockViewBrowser: BlockViewBrowserComponent;

  refSpecies: Species;
  compSpecies: Species;
  genomeColors: any;

  viewInBrowser: boolean = false;

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

  /**
   * Updates reference and comparison species with the most recent selections
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
  }

  getChromosomeFeatures() {
    // show block view browser
    this.viewInBrowser = true;

    // get the list of features (if any) for the selected chromosome
    let features = this.genomeView.getChromosomeFeaturesToView();

    // allow the block view browser to initialize
    this.cdr.detectChanges();
    this.blockViewBrowser.render(this.refSpecies,
                                 this.compSpecies,
                                 this.genomeColors,
                                 features.chr,
                                 features.features);

    setTimeout(() => {
      // TODO: this currently only will work in Firefox and Chrome
      document.getElementById('block-view')
              .scrollIntoView({behavior: 'smooth', block: 'end'});
    }, 50);

  }
}