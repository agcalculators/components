'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var redom = require('redom');
var calculatorsCore = require('@agc-calculators/calculators-core');

const inputDate = date => {
  if (typeof date === 'undefined') {
    return '';
  }

  let newDate = new Date(date);
  var dd = `0${newDate.getDate()}`.slice(-2);
  var mm = `0${newDate.getMonth() + 1}`.slice(-2);
  var y = newDate.getFullYear();
  return `${y}-${mm}-${dd}`;
};

const initData = inputs => {
  return Object.keys(inputs || {}).reduce((data, current) => {
    let inp = inputs[current];

    if (inp.default) {
      data[current] = typeof inp.default === 'function' ? inp.default(data) : inp.default;
    }

    return data;
  }, {});
};

const create = (ns = 'app') => {
  const fnOrProp = prop => {
    if (typeof prop === 'function') {
      return prop();
    }

    return prop;
  };

  const withEvents = (el, eventHandlers) => {
    el.addEventListener('change', eventHandlers['change']);
    el.addEventListener('keydown', eventHandlers['keydown']);
    return el;
  };

  const elementTypes = {
    'text': (key, inp, cls) => redom.el(`input.${cls}`, {
      id: key,
      type: 'text',
      name: key,
      value: inp.default ? fnOrProp(inp.default) : ''
    }),
    'number': (key, inp, cls) => redom.el(`input.${cls}`, {
      id: key,
      type: 'number',
      name: key,
      value: inp.default ? fnOrProp(inp.default) : ''
    }),
    'select': (key, inp, cls) => redom.el(`select.${cls}`, {
      id: key,
      name: key
    }, [...buildOptions(inp, inp.default || '')]),
    'date': (key, inp, cls) => redom.el(`input.${cls}`, {
      id: key,
      type: 'date',
      name: key,
      value: inp.default ? inputDate(fnOrProp(inp.default)) : inputDate(new Date())
    })
  };

  const buildOptions = (inp, selected) => {
    let opts = inp.options || [];
    return opts.reduce((arr, current) => {
      let opt = redom.el('option', {
        value: current.value || current,
        textContent: current.text || current
      });

      if (selected == current.value) {
        opt.setAttribute('selected', true);
      }

      arr.push(opt);
      return arr;
    }, []);
  };

  const buildForm = (calculator, eventHandlers, classNamesList) => {
    let form = {
      elements: [],
      submit: null,
      cancel: null
    };
    let inputs = calculator && calculator.inputs || {};
    let helpText = calculator && calculator.helpText || {};
    Object.keys(inputs).forEach(key => {
      let inp = inputs[key];

      if (inp.label) {
        form.elements.push(redom.el(`label.${classNamesList['label']}`, {
          htmlFor: key,
          textContent: inp.label
        }));
      }

      if (elementTypes[inp.type]) {
        form.elements.push(withEvents(elementTypes[inp.type](key, inp, classNamesList['control']), eventHandlers));
      } else {
        form.elements.push(withEvents(elementsTypes['text'](key, inp, classNamesList['control']), eventHandlers));
      }

      form.elements.push(redom.el(`.${classNamesList['errorMessage']}`, {
        style: {
          display: 'none'
        },
        dataset: {
          'for': key
        }
      }));

      if (helpText[key]) {
        form.elements.push(redom.el(`.${classNamesList['helpText']}`, redom.text(helpText[key])));
      }
    });
    form.submit = redom.el(`input.${classNamesList['submit']}`, {
      type: 'submit',
      textContent: 'Calculate',
      onclick: eventHandlers['submit']
    });
    form.cancel = redom.el(`button.${classNamesList['cancel']}`, {
      innerHTML: 'Cancel',
      onclick: eventHandlers['cancel']
    });
    return form;
  };

  class CalculatorForm {
    constructor(calculator) {
      this.calculator = calculator;
      this.data = initData(calculator.inputs);
      this.handlers = {
        submit: [],
        cancel: [],
        change: []
      };
      this.submitted = false;
      this.classNameList = {
        'form': `${ns}-calc-form`,
        'header': `${ns}-calc-form__header`,
        'title': `${ns}-calc-form__title`,
        'description': `${ns}-calc-form__description`,
        'label': `${ns}-calc-form__label`,
        'control': `${ns}-calc-form__control`,
        'submit': `${ns}-calc-form__submit-action`,
        'cancel': `${ns}-calc-form__cancel-action`,
        'error': `${ns}-has-errors`,
        'success': `${ns}-is-valid`,
        'errorMessage': `${ns}-calc-form__error-message`,
        'helpText': `${ns}-calc-form__help-text`
      };
      this.el = redom.el(`.${ns}-calc-form__wrapper`);
    }

    reset() {
      this.data = initData(this.calculator.inputs);
      this.submitted = false;
      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['control']}`), el => {
        el.classList.remove(this.classNameList['success']);
        el.classList.remove(this.classNameList['error']);
        el.value = '';
      });
      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['errorMessage']}`), el => {
        el.style.display = 'none';
        el.innerHTML = '';
      });
      Object.keys(this.data || {}).forEach(d => {
        let inputEl = this.el.querySelector(`[name="${d}"]`);

        if (inputEl) {
          switch (inputEl.getAttribute('type')) {
            case 'date':
              inputEl.value = inputDate(this.data[d]);
              break;

            default:
              inputEl.value = this.data[d];
              break;
          }
        }
      });
    }

    onSubmit(event) {
      event && event.preventDefault();
      this.submitted = true;
      let result = this.calculator.calculator(this.data);
      this.validate(Object.keys(this.calculator.inputs), result);

      if (result.errors && result.errors.count) {
        return;
      }

      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['control']}`), el => {
        el.classList.remove(this.classNameList['success']);
        el.classList.remove(this.classNameList['error']);
      });
      this.handlers['submit'].forEach(handler => {
        handler(result, () => this.reset());
      });
    }

    onCancel() {
      event && event.preventDefault();
      this.handlers['cancel'].forEach(handler => {
        handler(() => this.reset());
      });
    }

    onChange(event) {
      const {
        value,
        name
      } = event && event.target || {};
      this.data[name] = value;
      this.handlers['change'].forEach(handler => {
        handler(name, value, this.data);
      });
      this.validate(name, this.calculator.calculator(this.data));
    }

    onKeydown(event) {
      if (event.which === 13 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        let nextInput = calculatorsCore.nextSibling(event.target, `.${this.classNameList['control']}`);

        if (nextInput) {
          nextInput.focus();
        } else {
          event.target.blur();
          this.onSubmit(event);
        }

        return false;
      }

      return true;
    }

    validate(fields, result) {
      let errorMessages = this.calculator.messages || {};
      let validationFields = fields;

      if (typeof validationFields === 'string') {
        validationFields = [validationFields];
      }

      validationFields.forEach(key => {
        let inpEl = this.el.querySelector(`[name="${key}"]`);

        if (!inpEl || inpEl.style.display === 'none') {
          return;
        }

        inpEl.classList.remove(this.classNameList['error']);
        inpEl.classList.remove(this.classNameList['success']);
        let errorEl = this.el.querySelector(`.${this.classNameList['errorMessage']}[data-for="${key}"]`);

        if (errorEl) {
          errorEl.style.display = 'none';
          errorEl.textContent = '';
        }

        if (!result.errors || !result.errors[key]) {
          inpEl.classList.add(this.classNameList['success']);
          return;
        }

        inpEl.classList.add(this.classNameList['error']);
        let messages = Object.keys(result.errors[key] || {}).reduce((msg, err) => {
          if (errorMessages[key] && errorMessages[key][err]) {
            msg.push(errorMessages[key][err]);
          }

          return msg;
        }, []);

        if (errorEl && messages.length) {
          errorEl.style.display = 'block';
          errorEl.innerHTML = messages.join('<br />');
        }
      });
    }

    listen(event, handler) {
      if (!this.handlers[event]) {
        throw new Error(`'${event}' is not supported. Allowed events are submit, cancel and change.`);
      }

      if (typeof handler !== 'function') {
        throw new Error(`Expected listen handler to be a function. Received '${typeof handler}'.`);
      }

      this.handlers[event].push(handler);
      return this;
    }

    header(el) {
      this.customHeader = el;
      return this;
    }

    build(options) {
      const {
        submitText,
        cancelText,
        noCancel,
        noHeader,
        classNames,
        noValidate,
        title,
        description
      } = options || {};

      if (classNames) {
        this.classNameList = Object.assign({}, this.classNameList, classNames);
      }

      this.formObj = buildForm(this.calculator, {
        'submit': this.onSubmit.bind(this),
        'cancel': this.onCancel.bind(this),
        'change': this.onChange.bind(this),
        'keydown': this.onKeydown.bind(this)
      }, this.classNameList);

      if (submitText) {
        this.formObj.submit.value = submitText;
      }

      if (cancelText) {
        this.formObj.cancel.textContent = cancelText;
      }

      this.headerEl = !!noHeader ? redom.el('div') : redom.el(`.${this.classNameList['header']}`, [this.titleEl = redom.el(`h4.${this.classNameList['title']}`, title || this.calculator.name), this.descriptionEl = redom.el(`p.${this.classNameList['description']}`, description || this.calculator.description)]);
      let children = [this.customHeader || this.headerEl, ...this.formObj.elements];

      if (!noCancel) {
        children.push(this.formObj.cancel);
      }

      children.push(this.formObj.submit);

      if (!this.form) {
        this.form = redom.el(`form.${this.classNameList['form']}`, {
          onsubmit: this.onSubmit.bind(this)
        }, children);
        this.el.appendChild(this.form);
      } else {
        redom.setChildren(this.form, children);
      }

      if (noValidate) {
        this.form.setAttribute('novalidate', true);
      }

      return this;
    }

  }

  return {
    CalculatorForm
  };
};

const formatDate = (date, sep = "/") => {
  let newDate = new Date(date);
  var dd = newDate.getDate();
  var mm = newDate.getMonth() + 1;
  var y = newDate.getFullYear();
  return `${mm}${sep}${dd}${sep}${y}`;
};

const create$1 = (ns = "app") => {
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
      this.el = redom.el(`.${ns}-calc-results`);
      this.includeInputs = false;
    }

    update({
      reset,
      results
    }) {
      if (reset) {
        if (!results) {
          this.el.innerHTML = "";
        }
      }

      if (results) {
        this.results = results;
        this.el.innerHTML = "";
        console.log(this.calculator, results);
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

          label = redom.el(`p.${ns}-calc-results__item.${ns}-calc-results__item--output`, [redom.el("span", redom.text(`${output.label}:`)), redom.text(valueText)]);
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

            label = redom.el(`p.${ns}-calc-results__item.${ns}-calc-results__item--input`, [redom.el("span", redom.text(`${inp.label}:`)), redom.text(inputText)]);
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

  }

  return {
    CalculatorResults
  };
};

exports.createCalculatorForm = create;
exports.createCalculatorResults = create$1;
