import { el } from 'redom';

const create = (ns = 'app') => {

    class CalendarEventForm {
        constructor(event, classNames) {
            this.event = event;
            this.data = {};

            this.classNamesList = clss = Object.assign({}, {
                'form': `${ns}-calc-form`,
                'header': `${ns}-calc-form__header`,
                'event': `${ns}-calc-form__event`,
                'label': `${ns}-calc-form__label`,
                'control': `${ns}-calc-form__control`
            }, classNames);

            this.el = el(`.${ns}-calendar-event-form`, [
                this.headerEl = el(`.${clss['header']}`),
                this.formEl = el(`form.${clss['form']}`, [
                    el(`label.${clss['label']}`, { htmlFor: 'subject', textContent: 'Subject'}),
                    this.subjectEl = el(`input.${clss['control']}`, { type: 'text', value = this.event && this.event.subject }),
                    el(`label.${clss['label']}`, { htmlFor: 'description', textContent: 'Description'}),
                    this.descriptionEl = el(`textarea.${clss['control']}`, { rows: 3 })
                ])
            ]);

            this.subjectEl.addEventListener('change', this.onChange.bind(this));
            this.descriptionEl.addEventListener('change', this.onChange.bind(this));

        }
        onChange(event) {
            const { value, name } = event.target;
            this.data[name] = value;
        }
        update({event}) {
            
            this.event = event;

            if (event) {
                this.subjectEl.value = event.subject;
                this.descriptionEl.textContent = '';
            }
        }
    }

    return {
        CalendarEventForm
    }
}

export {
    create
}