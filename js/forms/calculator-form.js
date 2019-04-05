import { el, text, setChildren } from 'redom';
import { nextSibling } from '@agc-calculators/calculators-core';
import { inputDate, elementTypes } from './form-fields';


const initData = (inputs) => {
    return Object.keys(inputs || {}).reduce((data, current) => {
        let inp = inputs[current];
        if (inp.default) {
            data[current] = typeof inp.default === 'function' ? inp.default(data) : inp.default;
        }
        return data;
    }, {});
}

const create = (ns = 'app') => {

    const withEvents = (el, eventHandlers) => {
        el.addEventListener('change', eventHandlers['change']);
        el.addEventListener('keydown', eventHandlers['keydown']);
        return el;
    }
    
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
                form.elements.push(el(`label.${classNamesList['label']}`, { htmlFor: key, textContent: inp.label }));
            }
            if (elementTypes[inp.type]) {
                form.elements.push(withEvents(elementTypes[inp.type](key, inp, classNamesList['control']), eventHandlers));
            } else {
                form.elements.push(withEvents(elementsTypes['text'](key, inp, classNamesList['control']), eventHandlers));
            }
            form.elements.push(el(`.${classNamesList['errorMessage']}`, { style: { display: 'none' }, dataset: { 'for': key }}));

            if (helpText[key]) {
                form.elements.push(el(`.${classNamesList['helpText']}`, text(helpText[key])));
            }            
        });
    
        form.submit = el(`input.${classNamesList['submit']}`, { type: 'submit', textContent: 'Calculate', onclick: eventHandlers['submit'] });
        form.cancel = el(`button.${classNamesList['cancel']}`, { innerHTML: 'Cancel', onclick: eventHandlers['cancel'] });
    
        return form;
    }
    
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
            }           

            this.el = el(`.${ns}-calc-form__wrapper`);
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
                    switch(inputEl.getAttribute('type')) {
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
            const { value, name } = event && event.target || {};
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
                validationFields = [validationFields]
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

                let  messages = Object.keys(result.errors[key] || {}).reduce((msg, err) => {
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
                throw new Error(`'${event}' is not supported. Allowed events are submit, cancel and change.`)
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
            const { submitText, cancelText, noCancel, noHeader, classNames, noValidate, title, description } = options || {};

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

            this.headerEl = !!noHeader ? el('div') : el(`.${this.classNameList['header']}`, [
                this.titleEl = el(`h4.${this.classNameList['title']}`, title || this.calculator.name ),
                this.descriptionEl = el(`p.${this.classNameList['description']}`, description || this.calculator.description)
            ]);
            
            let children = [
                this.customHeader || this.headerEl,
                ...this.formObj.elements                
            ];

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
    }
}

export { 
    create
}