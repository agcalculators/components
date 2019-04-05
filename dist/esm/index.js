import { el, text, setChildren, svg } from 'redom';
import { nextSibling } from '@agc-calculators/calculators-core';

const fnOrProp = (prop, data = {}) => {
  if (typeof prop === 'function') {
    return prop(data);
  }

  return prop;
};

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

const elementTypes = {
  'text': (key, inp, cls) => el(`input.${cls}`, {
    id: key,
    type: 'text',
    name: key,
    value: inp.default ? fnOrProp(inp.default) : ''
  }),
  'textarea': (key, inp, cls) => el(`textarea.${cls}`, {
    id: key,
    type: 'text',
    name: key,
    value: inp.default ? fnOrProp(inp.default) : ''
  }),
  'number': (key, inp, cls) => el(`input.${cls}`, {
    id: key,
    type: 'number',
    name: key,
    value: inp.default ? fnOrProp(inp.default) : ''
  }),
  'select': (key, inp, cls) => el(`select.${cls}`, {
    id: key,
    name: key
  }, [...buildOptions(inp, inp.default || '')]),
  'date': (key, inp, cls) => el(`input.${cls}`, {
    id: key,
    type: 'date',
    name: key,
    value: inp.default ? inputDate(fnOrProp(inp.default)) : inputDate(new Date())
  })
};

const buildOptions = (inp, selected) => {
  let opts = inp.options || [];
  return opts.reduce((arr, current) => {
    let opt = el('option', {
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
  const withEvents = (el$$1, eventHandlers) => {
    el$$1.addEventListener('change', eventHandlers['change']);
    el$$1.addEventListener('keydown', eventHandlers['keydown']);
    return el$$1;
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
        form.elements.push(el(`label.${classNamesList['label']}`, {
          htmlFor: key,
          textContent: inp.label
        }));
      }

      if (elementTypes[inp.type]) {
        form.elements.push(withEvents(elementTypes[inp.type](key, inp, classNamesList['control']), eventHandlers));
      } else {
        form.elements.push(withEvents(elementsTypes['text'](key, inp, classNamesList['control']), eventHandlers));
      }

      form.elements.push(el(`.${classNamesList['errorMessage']}`, {
        style: {
          display: 'none'
        },
        dataset: {
          'for': key
        }
      }));

      if (helpText[key]) {
        form.elements.push(el(`.${classNamesList['helpText']}`, text(helpText[key])));
      }
    });
    form.submit = el(`input.${classNamesList['submit']}`, {
      type: 'submit',
      textContent: 'Calculate',
      onclick: eventHandlers['submit']
    });
    form.cancel = el(`button.${classNamesList['cancel']}`, {
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
      this.el = el(`.${ns}-calc-form__wrapper`);
    }

    reset() {
      this.data = initData(this.calculator.inputs);
      this.submitted = false;
      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['control']}`), el$$1 => {
        el$$1.classList.remove(this.classNameList['success']);
        el$$1.classList.remove(this.classNameList['error']);
        el$$1.value = '';
      });
      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['errorMessage']}`), el$$1 => {
        el$$1.style.display = 'none';
        el$$1.innerHTML = '';
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

      Array.prototype.forEach.call(this.el.querySelectorAll(`.${this.classNameList['control']}`), el$$1 => {
        el$$1.classList.remove(this.classNameList['success']);
        el$$1.classList.remove(this.classNameList['error']);
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
        let nextInput = nextSibling(event.target, `.${this.classNameList['control']}`);

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

    header(el$$1) {
      this.customHeader = el$$1;
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

      this.headerEl = !!noHeader ? el('div') : el(`.${this.classNameList['header']}`, [this.titleEl = el(`h4.${this.classNameList['title']}`, title || this.calculator.name), this.descriptionEl = el(`p.${this.classNameList['description']}`, description || this.calculator.description)]);
      let children = [this.customHeader || this.headerEl, ...this.formObj.elements];

      if (!noCancel) {
        children.push(this.formObj.cancel);
      }

      children.push(this.formObj.submit);

      if (!this.form) {
        this.form = el(`form.${this.classNameList['form']}`, {
          onsubmit: this.onSubmit.bind(this)
        }, children);
        this.el.appendChild(this.form);
      } else {
        setChildren(this.form, children);
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

const calendarIcon = (size = 16, options) => {
  const {
    stroke = "currentColor",
    fill = "currentColor",
    onclick
  } = options || {};
  let el$$1 = svg("svg", svg("symbol", {
    id: "calendar",
    viewBox: `0 0 32 32`
  }, svg("path", {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    stroke: stroke,
    fill: fill,
    d: "M10 12h4v4h-4zM16 12h4v4h-4zM22 12h4v4h-4zM4 24h4v4h-4zM10 24h4v4h-4zM16 24h4v4h-4zM10 18h4v4h-4zM16 18h4v4h-4zM22 18h4v4h-4zM4 18h4v4h-4zM26 0v2h-4v-2h-14v2h-4v-2h-4v32h30v-32h-4zM28 30h-26v-22h26v22z"
  })), svg("use", {
    xlink: {
      href: "#calendar"
    }
  }));

  if (onclick) {
    el$$1.addEventListener("click", onclick);
  }

  return el$$1;
};
const dashboardIcon = (size = 16, options) => {
  const {
    stroke = "currentColor",
    fill = "currentColor",
    onclick
  } = options || {};
  let el$$1 = svg("svg", svg("symbol", {
    id: "dashboard",
    viewBox: `0 0 32 32`
  }, svg("path", {
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    stroke: stroke,
    fill: fill,
    d: "M4 28h28v4h-32v-32h4zM9 26c-1.657 0-3-1.343-3-3s1.343-3 3-3c0.088 0 0.176 0.005 0.262 0.012l3.225-5.375c-0.307-0.471-0.487-1.033-0.487-1.638 0-1.657 1.343-3 3-3s3 1.343 3 3c0 0.604-0.179 1.167-0.487 1.638l3.225 5.375c0.086-0.007 0.174-0.012 0.262-0.012 0.067 0 0.133 0.003 0.198 0.007l5.324-9.316c-0.329-0.482-0.522-1.064-0.522-1.691 0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3-0.067 0-0.133-0.003-0.198-0.007l-5.324 9.316c0.329 0.481 0.522 1.064 0.522 1.691 0 1.657-1.343 3-3 3s-3-1.343-3-3c0-0.604 0.179-1.167 0.487-1.638l-3.225-5.375c-0.086 0.007-0.174 0.012-0.262 0.012s-0.176-0.005-0.262-0.012l-3.225 5.375c0.307 0.471 0.487 1.033 0.487 1.637 0 1.657-1.343 3-3 3z"
  })), svg("use", {
    xlink: {
      href: "#dashboard"
    }
  }));

  if (onclick) {
    el$$1.addEventListener("click", onclick);
  } //el.style = { display: 'inline-block', strokeWidth: 0, stroke: stroke, fill: fill };


  return el$$1;
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
      this.handlers = [];
      this.el = el(`.${ns}-calc-results`);
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
        const dashboardItems = this.calculator.dashboard || {};
        const calendarItems = this.calculator.calendar || {};

        const dispatchAction = (tag, payload) => {
          (this.handlers || []).forEach(handler => {
            handler(tag, payload);
          });
        };

        const getActions = key => {
          return el(`.${ns}-calc-results__item-actions`, [dashboardItems[key] ? el(`span.${ns}-calc-results__item-action`, dashboardIcon(16, {
            onclick: () => dispatchAction('createDashboardItem', {
              item: dashboardItems[key],
              data: results
            })
          })) : '', calendarItems[key] ? el(`span.${ns}-calc-results__item-action`, calendarIcon(16, {
            onclick: () => dispatchAction('createCalendarItem', {
              item: calendarItems[key],
              data: results
            })
          })) : '']);
        };

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

          label = el(`p.${ns}-calc-results__item.${ns}-calc-results__item--output`, [el("span", text(`${output.label}:`)), text(valueText), getActions(key)]);
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

            label = el(`p.${ns}-calc-results__item.${ns}-calc-results__item--input`, [el("span", text(`${inp.label}:`)), text(inputText)]);
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

const create$2 = (ns = "app") => {
  class MeasureWidget {
    constructor(props, data) {
      const {
        title,
        details,
        measure,
        units = '',
        formatters = {}
      } = props;
      this.propData = { ...data,
        units,
        formatters
      };
      this.el = el(`.${ns}-measure-widget`, [this.titleEl = el(`h4.${ns}-measure-widget__title`, {
        textContent: fnOrProp(title, this.propData)
      }), this.measureEl = el(`.${ns}-measure-widget__measure`, {
        innerText: fnOrProp(measure, this.propData)
      }), this.detailsEl = el(`.${ns}-measure-widget__details`, {
        innerText: fnOrProp(details, this.propData)
      })]);
    }

    update(props) {
      const {
        data
      } = props || {};

      if (data) {
        const {
          title,
          details,
          measure
        } = data;

        if (title) {
          this.titleEl.textContent = title;
        }

        if (details) {
          this.detailsEl.innerText = details;
        }

        if (measure) {
          this.measureEl.innerText = measure;
        }
      }
    }

  }

  class MeasureWidgetForm {
    constructor(props, data) {
      const {
        title,
        details,
        measure,
        units = '',
        formatters
      } = props;
      this.propData = { ...data,
        units,
        formatters
      };
      this.data = {};
      this.handlers = {
        submit: [],
        cancel: []
      };
      const labelClassName = `${ns}-widget-form__label`;
      this.controlClassName = `${ns}-widget-form__control`;

      const withEvents = el$$1 => {
        el$$1.addEventListener('change', this.onChange.bind(this));
        el$$1.addEventListener('keydown', this.onKeydown.bind(this));
        return el$$1;
      };

      this.el = el(`form.${ns}-widget-form`, [el(`label.${labelClassName}`, {
        htmlFor: 'title',
        textContent: 'Title'
      }), withEvents(elementTypes['text']('title', {
        default: fnOrProp(title, this.propData)
      }, this.controlClassName)), el(`label.${labelClassName}`, {
        htmlFor: 'measure',
        textContent: 'Measure'
      }), withEvents(elementTypes['text']('measure', {
        default: fnOrProp(measure, this.propData)
      }, this.controlClassName)), el(`label.${labelClassName}`, {
        htmlFor: 'details',
        textContent: 'Details'
      }), withEvents(elementTypes['text']('details', {
        default: fnOrProp(details, this.propData)
      }, this.controlClassName)), el(`.${ns}-widget-form__actions`, [el(`button.${ns}-widget-form__cancel-action`, {
        innerHTML: 'Cancel',
        onclick: this.onCancel.bind(this)
      }), el(`input.${ns}-widget-form__submit-action`, {
        type: 'submit',
        value: 'Create',
        onclick: this.onSubmit.bind(this)
      })])]);
    }

    onChange(event) {
      const {
        name,
        value
      } = event.target;
      this.data[name] = value;
    }

    onKeydown(event) {
      if (event.which === 13 || event.keyCode === 13) {
        event.preventDefault();
        event.stopPropagation();
        let nextInput = nextSibling(event.target, this.controlClassName);

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

    onCancel(event) {
      event && event.preventDefault();
      this.handlers['cancel'].forEach(handler => {
        handler();
      });
    }

    onSubmit(event) {
      event && event.preventDefault();
      this.handlers['submit'].forEach(handler => {
        handler(this.data);
      });
    }

    listen(event, handler) {
      if (!this.handlers[event]) {
        throw new Error(`'${event}' is not supported. Allowed events are submit and cancel.`);
      }

      if (typeof handler !== 'function') {
        throw new Error(`Expected listen handler to be a function. Received '${typeof handler}'.`);
      }

      this.handlers[event].push(handler);
      return this;
    }

  }

  return {
    MeasureWidget,
    MeasureWidgetForm
  };
};

export { create as createCalculatorForm, create$1 as createCalculatorResults, create$2 as createMeasureWidget };
