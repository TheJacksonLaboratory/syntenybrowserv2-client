import { Component } from '@angular/core';

@Component({
  selector: 'species-selection-help',
  template: `
    <clr-modal clrModalSize="lg" [(clrModalOpen)]="open">
      <h3 class="modal-title">Selecting a Species</h3>

      <div class="modal-body">
        <ul>
          <li>
            Select which species you desire to be the reference and comparison.
          </li>
          <li>
            The reference and comparison may not be the same species.
          </li>
          <li>
            If the reference species is changed, the feature search will begin
            loading the features for the new references species and the genome
            view will be re-rendered and reset. Any selections you may have made
            in the feature or ontology search will also be cleared.
          </li>
          <li>
            Upon change of just the comparison species, the genome view will be
            re-rendered with a new inner ring. Feature search selections will
            not be cleared, however, and will be included in the re-rendered
            genome view.
          </li>
        </ul>
      </div>
    </clr-modal>
  `,
})
export class SpeciesSelectionHelpComponent {
  // indicates if the modal is open or not
  open: boolean;
}
