import { el } from 'redom';
import { nextSibling } from '@agc-calculators/calculators-core';
import { fnOrProp, elementTypes } from '../forms/form-fields';

const create = (ns = "app") => {    

    class MeasureWidget {
        constructor(props, data) {
            
            const { title, details, measure, units = '', formatters = {} } = props;
            this.propData = {...data, units, formatters};

            this.el = (el(`.${ns}-measure-widget`, [
                this.titleEl = el(`h4.${ns}-measure-widget__title`, { textContent: fnOrProp(title, this.propData)}),
                this.measureEl = el(`.${ns}-measure-widget__measure`, { innerText: fnOrProp(measure, this.propData)}),
                this.detailsEl = el(`.${ns}-measure-widget__details`, { innerText: fnOrProp(details, this.propData)})
            ]));
        }
        update(props) {
            const { data } = props || {};
            if (data) {
                const { title, details, measure } = data;
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
            const { title, details, measure, units = '', formatters } = props;
            this.propData = {...data, units, formatters};
            this.data = {};
            this.handlers = {
                submit: [],
                cancel: []
            };
          
            const labelClassName = `${ns}-widget-form__label`;
            this.controlClassName = `${ns}-widget-form__control`;

            const withEvents = (el) => {
                el.addEventListener('change', this.onChange.bind(this));
                el.addEventListener('keydown', this.onKeydown.bind(this));
                return el;
            }

            this.el = (el(`form.${ns}-widget-form`, [
                el(`label.${labelClassName}`, { htmlFor: 'title', textContent: 'Title'}),
                withEvents(elementTypes['text']('title', {default: fnOrProp(title, this.propData)}, this.controlClassName)),
                el(`label.${labelClassName}`, { htmlFor: 'measure', textContent: 'Measure'}),
                withEvents(elementTypes['text']('measure', {default: fnOrProp(measure, this.propData)}, this.controlClassName)),
                el(`label.${labelClassName}`, { htmlFor: 'details', textContent: 'Details'}),
                withEvents(elementTypes['text']('details', {default: fnOrProp(details, this.propData)}, this.controlClassName)),
                el(`.${ns}-widget-form__actions`, [                    
                    el(`button.${ns}-widget-form__cancel-action`, { innerHTML: 'Cancel', onclick: this.onCancel.bind(this) }),
                    el(`input.${ns}-widget-form__submit-action`, { type: 'submit', value: 'Create', onclick: this.onSubmit.bind(this) })
                ])
            ]))
        }
        onChange(event) {
            const { name, value } = event.target;
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
                throw new Error(`'${event}' is not supported. Allowed events are submit and cancel.`)
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
    }
}

export {
    create
}
