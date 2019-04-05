import { el, text } from "redom";
import { calendarIcon, dashboardIcon } from '../icons/index';

const formatDate = (date, sep = "/") => {
  let newDate = new Date(date);

  var dd = newDate.getDate();
  var mm = newDate.getMonth() + 1;
  var y = newDate.getFullYear();

  return `${mm}${sep}${dd}${sep}${y}`;
};

const create = (ns = "app") => {

  const format = (val, obj) => {
    switch (obj.type) {
      case "date":
        return formatDate(val, obj.separator);
      case "number":
        return `${parseFloat(`${val}`).toFixed(obj.precision || 0)} ${obj.units || ""}`;
      default:
        return val;
    }
  };

  class CalculatorResults {
    constructor(calculator) {
      this.calculator = calculator;
      this.excludes = [];
      this.handlers = [];
      this.el = el(`.${ns}-calc-results`);
      this.includeInputs = false;
    }
    update({ reset, results }) {
      if (reset) {
        if (!results) {
          this.el.innerHTML = "";
        }
      }
      if (results) {
        this.results = results;

        this.el.innerHTML = "";

        const dashboardItems = this.calculator.dashboard || {};
        const calendarItems = this.calculator.calendar || {};

        const dispatchAction = (tag, payload) => {
          (this.handlers || []).forEach(handler => {
            handler(tag, payload);
          })
        }

        const getActions = (key) => {
          return (el(`.${ns}-calc-results__item-actions`, [
            dashboardItems[key] ? el(`span.${ns}-calc-results__item-action`, dashboardIcon(16, { onclick: () => dispatchAction('createDashboardItem', { item: dashboardItems[key], data: results })})) : '',
            calendarItems[key] ? el(`span.${ns}-calc-results__item-action`, calendarIcon(16, { onclick: () => dispatchAction('createCalendarItem', { item: calendarItems[key], data: results })})) : ''
          ]))
        }

        let label;

        Object.keys(this.calculator.outputs).forEach(key => {
          if (this.excludes.indexOf(key) !== -1) {
            return;
          }
          let output = this.calculator.outputs[key];

          let valueText = results[key];

          if (this.calculator.formatters && this.calculator.formatters[key]) {
              valueText = this.calculator.formatters[key](results[key]);
          } else if (this.formatFn) {
              valueText = this.formatFn(results[key], output);
          } else {
              valueText = format(results[key], output);
          }

          label = el(
            `p.${ns}-calc-results__item.${ns}-calc-results__item--output`,
            [
              el("span", text(`${output.label}:`)),
              text(valueText),
              getActions(key)
            ]
          );
          this.el.appendChild(label);
        });
        if (this.includeInputs) {
          Object.keys(this.calculator.inputs).forEach(key => {
            if (this.excludes.indexOf(key) !== -1) {
              return;
            }
            let inp = this.calculator.inputs[key];

            let inputText = results[key];

            if (this.calculator.formatters && this.calculator.formatters[key]) {
                inputText = this.calculator.formatters[key](results[key]);
            } else if (this.formatFn) {
                inputText = this.formatFn(results[key], inp);
            } else {
                inputText = format(results[key], inp);
            }

            label = el(
              `p.${ns}-calc-results__item.${ns}-calc-results__item--input`,
              [
                el("span", text(`${inp.label}:`)),
                text(inputText)
              ]
            );
            this.el.appendChild(label);
          });
        }
      }
    }
    useFormatter(formatFn) {
      if (typeof formatFn !== "function") {
        throw new Error("formatter must be a function.");
      }
      this.formatFn = formatFn;
      return this;
    }
    showInputs() {
      this.includeInputs = true;
      return this;
    }
    exclude(...props) {
      this.excludes = [...props];
      return this;
    }
    onAction(handler) {
      if (typeof handler === 'function') {
        this.handlers.push(handler);
      }
      return this;
    }
  }

  return {
    CalculatorResults
  };
};

export { create };
