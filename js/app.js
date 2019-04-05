import { el, setChildren } from 'redom';
import { create as createForm } from './forms/calculator-form';
import { create as createResults } from './results/calculator-results';
import { create as createMeasureWidget } from './widgets/measure';
import { forms } from '@agc-calculators/livestock';

const { CalculatorForm } = createForm('app');
const { CalculatorResults } = createResults('app');
const { MeasureWidget, MeasureWidgetForm } = createMeasureWidget('app');

const allCalcs = Object.keys(forms).reduce((arr, current) => {
  arr.push({ name: forms[current].name, form: forms[current] });
  return arr;
}, []);



const measureData = {
  adjustment: 5,
  adjustedBirthWeight: 120,
  calculated: new Date(),
  birthWeight: 115,
  ageOfDam: 3
}

const formData = (measure) => ({
  ...forms['adjustedBirthWeightForm'].dashboard[measure].params,
  formatters: forms['adjustedBirthWeightForm'].formatters,
  category: forms['adjustedBirthWeightForm'].category
})

export class App {
  constructor () {
    this.links = allCalcs.map(calc => el('a.app-calc-link', { textContent: calc.name, onclick: () => this.setForm(calc.form)}))

    this.el = el('.app', [
      this.formEl= el('.form-wrapper'),
      ...this.links,
      this.measure1 = new MeasureWidget(formData('adjustedBirthWeight'), measureData),      
      new MeasureWidget(formData('adjustment'), measureData),      
      new MeasureWidgetForm(formData('adjustedBirthWeight'), measureData)
        .listen('submit', (data) => {
          this.measure1.update({data: data});
        })
    ]);
    this.data = {};
  }
  setForm(form) {
    this.currentForm = form;

    let children = [
      this.form = new CalculatorForm(form)
        .listen('submit', (data, reset) => {
          this.results.update({results: data});
        })
        .listen('cancel', (reset) => {
          reset();
          this.results.update({reset: true});
        })
        .header(el('h1.header', `🐮 ${form.name}`))
        .build({
          cancelText: 'Reset',
          submitText: 'Calculate'
        }),
        this.results = 
          new CalculatorResults(form)
            .showInputs()
            .exclude('calculated')
            .onAction((tag, payload) => {
                //console.log('action', tag, payload);
                //this.api && this.api.dispatch(tag, payload);
            })
    ];

    setChildren(this.formEl, children);

  }
  update (data) {

    this.data = data;
  }
}
