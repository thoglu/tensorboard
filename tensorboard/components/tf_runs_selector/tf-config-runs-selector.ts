
import {computed, customElement, property, observe} from '@polymer/decorators';
import {html, PolymerElement} from '@polymer/polymer';
import '../polymer/irons_and_papers';
import * as _ from 'lodash';
import {LegacyElementMixin} from '../polymer/legacy_element_mixin';
import * as baseStore from '../tf_backend/baseStore';
import {RequestManager} from '../tf_backend/requestManager';
import {environmentStore} from '../tf_backend/environmentStore';
import {getRouter} from '../tf_backend/router';
import {runsStore} from '../tf_backend/runsStore';
import {runsColorScale} from '../tf_color_scale/colorScale';
import '../tf_dashboard_common/tf-multi-checkbox';
import * as storage from '../tf_storage/storage';
import '../tf_wbr_string/tf-wbr-string';

@customElement('tf-config-runs-selector')
class TfConfigRunsSelector extends LegacyElementMixin(PolymerElement) {
  static readonly template = html`
    <paper-dialog with-backdrop="" id="data-location-dialog">
      <h2>Data Location</h2>
      <tf-wbr-string
        value="[[dataLocation]]"
        delimiter-pattern="[[_dataLocationDelimiterPattern]]"
      >
      </tf-wbr-string
    ></paper-dialog>
    <div id="top-text">
      <h3 id="tooltip-help" class="tooltip-container">Runs</h3>
    </div>
    <tf-multi-checkbox
      id="multiCheckbox"
      names="[[joint_config_strings]]"
      selection-state="{{configSelectionState}}"
      out-selected="{{selected_joint_config_strings}}"
      regex="{{regexInput}}"
      coloring="[[coloring]]"
    ></tf-multi-checkbox>
    <paper-button class="x-button" id="toggle-all" on-tap="_toggleAll">
      Toggle All Runs
    </paper-button>
    <template is="dom-if" if="[[dataLocation]]">
      <div id="data-location">
        <tf-wbr-string
          value="[[_clippedDataLocation]]"
          delimiter-pattern="[[_dataLocationDelimiterPattern]]"
        ></tf-wbr-string
        ><!--
          We use HTML comments to remove spaces before the ellipsis.
        --><template
          is="dom-if"
          if="[[_shouldShowExpandDataLocationButton(dataLocation, _dataLocationClipLength)]]"
          ><!--
          --><a href="" on-click="_openDataLocationDialog">…</a>
        </template>
      </div>
    </template>
    <style>
      :host {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        padding-bottom: 10px;
      }
      #top-text {
        color: var(--tb-secondary-text-color);
        width: 100%;
        flex-grow: 0;
        flex-shrink: 0;
        padding-right: 16px;
        box-sizing: border-box;
      }
      tf-wbr-string {
        overflow-wrap: break-word;
      }
      tf-multi-checkbox {
        display: flex;
        flex-grow: 1;
        flex-shrink: 1;
        overflow: hidden;
      }
      .x-button {
        font-size: 13px;
        background-color: var(--tb-ui-light-accent);
        color: var(--tb-ui-dark-accent);
      }
      #tooltip-help {
        color: var(--tb-secondary-text-color);
        margin: 0;
        font-weight: normal;
        font-size: 14px;
        margin-bottom: 5px;
      }
      paper-button {
        margin-left: 0;
      }
      #data-location {
        color: var(--tb-ui-dark-accent);
        font-size: 13px;
        margin: 5px 0 0 0;
        max-width: 288px;
      }
    </style>
  `;

  @property({
    type: Object,
    observer: '_storeRunSelectionState',
  })
  runSelectionState: object = storage
    .getObjectInitializer('runSelectionState', {
      defaultValue: {},
    })
    .call(this);

  @observe(
    "configSelectionState")
  _testthis(updated_vals)
  {
    
    this.set("runSelectionState",_.mapKeys(updated_vals, (val, key) => 
          { 
            const lineBreakIndex = key.indexOf('\n');

            let substr=key.substring(0, lineBreakIndex);
           
            return substr
          }
          ));
  
  }
  @property({
    type: String,
    observer: '_regexObserver',
  })
  regexInput: string = storage
    .getStringInitializer('regexInput', {
      defaultValue: '',
    })
    .call(this);

  // we update this one based on the changes to selected_joint_config_strings
  @property({
    type: Array,
    notify: true,
  })
  selectedRuns: unknown[];

  @property({type: Array})
  runs: unknown[];

  // config strings .. updated by checkbox
  @property({type: Array})
  joint_config_strings: unknown[];

  // selected config strings .. updated by checkbox
  @property({type: Array})
  selected_joint_config_strings: unknown[];

  @observe(
    'selected_joint_config_strings',
  )
  _update_selected_runs() {
    this.selectedRuns = _.map(this.selected_joint_config_strings, (config_string: string) => 
          { 
            const lineBreakIndex = config_string.indexOf('\n');

            let substr=config_string.substring(0, lineBreakIndex);
            
            return substr
          }
          );
  }

  @property({
    type: String,
    notify: true,
  })
  dataLocation: string;

  @property({
    type: Number,
  })
  _dataLocationClipLength: number = 250;

  @property({type: Object})
  _requestManager: RequestManager = new RequestManager(50);

  @property({
    type: String,
  })
  readonly _dataLocationDelimiterPattern: string = '[/=_,-]';

  @property({
    type: Object,
  })
  coloring: object = {
    getColor: (x) => {
      const lineBreakIndex = x.indexOf('\n');

      let substr=x.substring(0, lineBreakIndex);
      
      return runsColorScale(substr);
    }
  };

 
  // a function that merges configs into runs and returns an array with joined info

  _merge_runs_with_configs(run_arr) 
  {

    if(run_arr.length>0)
    {
      var pars=new URLSearchParams({run_list: run_arr});
  
      const url = getRouter().pluginRoute('scalars', '/configs_for_runs', pars);


      this._requestManager.request(url).then((resulting_cfg_info) => {
        if (_.isEqual(resulting_cfg_info, this.joint_config_strings)) {
          // No need to update anything if there are no changes.
          return;
        }
        this.set("joint_config_strings", resulting_cfg_info);

      });
    }
    
      
  }
  

  _runStoreListener: baseStore.ListenKey;

  _envStoreListener: baseStore.ListenKey;

  override attached() {
 
    this._runStoreListener = runsStore.addListener(() => {
      this.set('runs', runsStore.getRuns());
      this._merge_runs_with_configs(this.runs);
    });
    this.set('runs', runsStore.getRuns());
    this._merge_runs_with_configs(this.runs);

    this._envStoreListener = environmentStore.addListener(() => {
      this.set('dataLocation', environmentStore.getDataLocation());
    });
    this.set('dataLocation', environmentStore.getDataLocation());
  }

  override detached() {
    runsStore.removeListenerByKey(this._runStoreListener);
    environmentStore.removeListenerByKey(this._envStoreListener);
  }

  _toggleAll() {
    (this.$.multiCheckbox as any).toggleAll();
  }

  @computed('dataLocation', '_dataLocationClipLength')
  get _clippedDataLocation(): string | undefined {
    var dataLocation = this.dataLocation;
    var dataLocationClipLength = this._dataLocationClipLength;
    if (dataLocation === undefined) {
      // The dataLocation has not been set yet.
      return undefined;
    }
    if (dataLocation.length > dataLocationClipLength) {
      // Clip the dataLocation to avoid blocking the runs selector. Let the
      // user view a more full version of the dataLocation.
      return dataLocation.substring(0, dataLocationClipLength);
    } else {
      return dataLocation;
    }
  }

  _openDataLocationDialog(event) {
    event.preventDefault();
    (this.$$('#data-location-dialog') as any).open();
  }

  _shouldShowExpandDataLocationButton(dataLocation, _dataLocationClipLength) {
    return dataLocation && dataLocation.length > _dataLocationClipLength;
  }

  _storeRunSelectionState = storage.getObjectObserver('runSelectionState', {
    defaultValue: {},
  });

  _regexObserver = storage.getStringObserver('regexInput', {
    defaultValue: '',
  });
}
