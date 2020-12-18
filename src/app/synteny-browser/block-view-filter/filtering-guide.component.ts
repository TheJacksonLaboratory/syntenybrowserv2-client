import { Component } from '@angular/core';

@Component({
  selector: 'filtering-guide',
  template: `
    <div class="clr-row">
      <clr-stack-view class="clr-col-12">
        <clr-stack-header> Block View Filtering Guide </clr-stack-header>
        <clr-stack-block [clrSbExpanded]="true">
          <clr-stack-label> Summary </clr-stack-label>
          <clr-stack-block class="block-body">
            <p>
              The block view browser contains a lot of information and much of it may not be
              pertinent to what you’re looking for. You have the ability to select features from the
              feature table towards the top of the application, which will appear in red in the
              block view, but filtering can add another level of focus to features or regions of
              interest.
            </p>
          </clr-stack-block>
        </clr-stack-block>
        <clr-stack-block>
          <clr-stack-label> Adding/Editing Filters </clr-stack-label>
          <clr-stack-block>
            <clr-stack-label> Anatomy of a Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <p>
                There are two ways to create filters. The default method is creating a simple
                filter. Using the dropdown menu, you are provided options to construct the filter
                instructions. If the condition you select requires an input value, a field to enter
                that input will become available. Simple filters are the quickest to create but they
                have some limitations. A simple filter is made up of only a single condition and in
                some cases, doesn't support as many qualifier options. If you need more control or
                customization, you may need to create an advanced filter, which can be found under
                the form.
              </p>
              <ul class="list">
                <li>
                  <b>Species:</b> identifies the species that the filter will look for matches in.
                  If the selected species is the reference, the current reference chromosome will be
                  searched for matches. If the selected species is the comparison, the regions in
                  the comparison genome that are syntenic to the reference on the current reference
                  chromosome will be searched for matches. If the selected species is ‘Both’, both
                  of the aforementioned regions will be included in the search.
                </li>
                <li>
                  <b>Mode:</b> filters can operate in one of two modes: hide or highlight. If the
                  selected mode is hide, all features matching the filter will be hidden from view
                  and if the mode is highlight, all features matching the filter will be colored in
                  blue. In the case where a feature matches a hide filter AND a highlight filter,
                  the highlight filter will be prioritized.
                </li>
                <li>
                  <b>Conditions:</b> filters can have one or more conditions. In order for a feature
                  to match a filter, it must satisfy ALL of the filter’s conditions. If there are
                  multiple conditions in a filter, a remove button should appear to the right of
                  each of the additional conditions. Since a filter requires at least a single
                  condition, all but the first condition can be removed.
                  <ul class="list">
                    <li>
                      <b>Filtering by Type:</b> offered as 'is categorized as a...' in the dropdown,
                      provides you with a select dropdown with the available types available based
                      on the selected species.
                    </li>
                    <li>
                      <b>Filtering by ID:</b> offered as 'Has an ID that...' in the dropdown,
                      provides you with an input where you could enter a gene ID select and a
                      dropdown allowing you to choose whether you're looking for exact matches,
                      "like" matches or features that <i>don't</i> match the input value.
                    </li>
                    <li>
                      <b>Filtering by Symbol:</b> offered as 'Has a symbol that...' in the dropdown,
                      provides you with an input where you could enter a gene symbol or a prefix and
                      a select dropdown allowing you to choose whether you're looking for exact
                      matches, "like" matches or features that <i>don't</i> match the input value.
                    </li>
                    <li>
                      <b>Filtering by Chromosome: (available only for a comparison filter)</b>
                      offered as 'Is located on chromosome...' in the dropdown, provides you with a
                      select dropdown allowing you to choose a comparison species chromosome.
                    </li>
                    <li>
                      <b>Ontology Term:</b> offered as 'Is associated with a
                      <i>ontology abbrev</i> term...' in the dropdown, provides you an input where
                      you can scroll through the selected ontology terms and select from the options
                      or start typing a term to filter options.
                    </li>
                    <li>
                      <b>Qualifiers:</b> filtering by symbol/ID attribute will provide you with a
                      qualifier select. By default, the qualifier will be ‘is equal to’ which will
                      check that the search for features whose attribute is an exact match for the
                      value entered. You can choose ‘not equal to’ which will search for features
                      whose attribute is NOT the entered value. Additionally you have ‘is like’ and
                      ‘is not like’ which will search for features whose attribute contains (or not)
                      the entered value.
                      <i
                        >For example, if you were viewing Mouse as the reference species, chromosome
                        14, and wanted to highlight a series of genes whose symbol starts with
                        ‘traj’ (for which there are several), you’d be able to highlight all of them
                        no matter what numeric suffix they have. On the other hand, if you wanted to
                        highlight all BUT that series of genes, you could use the ‘is not like’
                        qualifier.</i
                      >
                    </li>
                  </ul>
                </li>
                <li>
                  If you want to want more than one condition in a filter, you can press the ‘new
                  condition’ button to add another condition to the filter. It’s important to note
                  that when applying a single filter, matches must match all conditions in the
                  filter.
                  <i
                    >For example, if you wanted to highlight rRNA genes and tRNA genes (which
                    translates to ‘type = rRNA gene’ OR ‘type = tRNA gene’), you will want to create
                    two separate filters, each with a single condition to filter on the types you
                    want. You would <b>NOT</b> want to create a single filter with two type filters
                    (which would translate to ‘type = rRNA gene’ AND ‘type = tRNA’) as the filter
                    would be looking for features that are both rRNA genes AND tRNA genes, producing
                    a result of 0 matching features for the filter.</i
                  >
                </li>
                <li>
                  As you fill out the fields in the conditions, a filter name will generate. You can
                  use this name, by default, or you can rename it.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Filter Labels </clr-stack-label>
            <clr-stack-block class="block-body split">
              <ul class="list clr-col-6">
                <li>
                  A filter label contains and summarizes information about how the associated filter
                  is configured.
                </li>
                <li>
                  A blue filter label indicates the associated filter highlights matching features
                  and a red filter label indicates the associated filter hides matching features. If
                  a feature matches a hiding filter and a highlighting filter, the feature will be
                  highlighted as highlighting filters always take precedence over hiding filters.
                </li>
                <li>
                  The first word in the filter label also indicates the mode of the filter.
                </li>
                <li>
                  The content within square brackets in the filter label summarize the conditions of
                  the filter.
                </li>
                <li>
                  The last part of the filter label identifies the common names of species the
                  filter will search for matches.
                </li>
                <li>
                  Clicking on the ‘X’ in a filter label will delete the associated filter.
                </li>
                <li>
                  Clicking on the text in a filter label will open the associated filter in editing
                  mode below the filter labels.
                </li>
              </ul>
              <div class="clr-col-6">
                <img id="diagram" src="../../../assets/filter-label-diagram.png" alt="" />
              </div>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Adding a New Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <ul class="list">
                <li>
                  When opening the block view filters modal, a default filter constructor will be
                  loaded so you can start editing the fields to create a new filter.
                </li>
                <li>
                  Once finished with a filter, click the ‘finish editing filter’ button and you will
                  see a colored label appear in the field towards the top of the modal. A blue label
                  indicates a ‘highlight’ filter and a red label indicates a ‘hide’ filter.
                </li>
                <li>
                  If you’re editing a filter and navigate to a different tab (as long as you don’t
                  close the modal), your current filter will still be there, in its current state
                  for you to finish, continue editing, or throw out.
                </li>
                <li>
                  If you’re editing a filter and click on a label of a different filter, the changes
                  to the current filter WILL BE LOST as clicking on the label of a filter will open
                  that filter in editing mode and will overwrite your current filter.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
          <clr-stack-block>
            <clr-stack-label> Editing a Filter </clr-stack-label>
            <clr-stack-block class="block-body">
              <ul class="list">
                <li>
                  Clicking on the text of a filter label will open the associated filter in editing
                  mode.
                </li>
                <li>
                  You can edit any parts of the filter in this mode, and when finished, click the
                  ‘finish editing filter’.
                </li>
                <li>
                  Clicking on the ‘X’ in a filter label will delete the associated filter.
                </li>
              </ul>
            </clr-stack-block>
          </clr-stack-block>
        </clr-stack-block>
        <clr-stack-block>
          <clr-stack-label> Previewing Filters </clr-stack-label>
          <clr-stack-block class="block-body">
            <ul class="list">
              <li>
                If you have created filters, you can utilize the preview filters page. If you
                haven’t created any filters, you can see the preview filters page but it won’t be
                helpful at all.
              </li>
              <li>
                The filter results table will show the features that will be affected by the current
                combination of filters selected in the checklist.
              </li>
              <li>
                Features that will be hidden by the set of filters will be represented by a red row
                containing the feature’s metadata and those that will be highlighted will be
                represented by a blue row. A feature is only listed once in the table and since
                highlighting filters take precedence over hiding filters, if a feature matches a
                highlighting filter AND a hiding filter, it will appear blue in the table as it will
                be highlighted rather than hidden.
              </li>
              <li>
                If you would like to download the contents of the table, click the ‘download table’
                button at the bottom of the modal to trigger a .txt file containing the metadata for
                all of the features listed in the table including whether they will be highlighted
                or hidden and data on the filters that produce the list of filters.
              </li>
            </ul>
          </clr-stack-block>
        </clr-stack-block>
      </clr-stack-view>
    </div>
  `,
  styleUrls: ['./block-view-filter.component.scss'],
})
export class FilteringGuideComponent {}
