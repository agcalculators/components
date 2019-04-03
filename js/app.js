import { el, setChildren } from 'redom';
import { dispatch } from './dispatch';
import { create as createForm } from './forms/calculator-form';
import { create as createResults } from './results/calculator-results';
import { forms } from '@agc-calculators/livestock';

const { CalculatorForm } = createForm('app');
const { CalculatorResults } = createResults('app');

const allCalcs = Object.keys(forms).reduce((arr, current) => {
  arr.push({ name: forms[current].name, form: forms[current] });
  return arr;
}, []);

console.log('form', allCalcs);

export class App {
  constructor () {

    this.links = allCalcs.map(calc => el('a.app-calc-link', { textContent: calc.name, onclick: () => this.setForm(calc.form)}))

    this.el = el('.app', [
      this.formEl= el('.form-wrapper'),
      ...this.links
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
        this.results = new CalculatorResults(form).showInputs().exclude('calculated')
    ];

    setChildren(this.formEl, children);

  }
  update (data) {

    this.data = data;
  }
}
