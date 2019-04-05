import { el } from 'redom';

const fnOrProp = (prop, data = {}) => {
    if (typeof prop === 'function') {
        return prop(data);
    }
    return prop;
}

const inputDate = (date) => {
    if (typeof date === 'undefined') { return '' }

    let newDate = new Date(date)
    var dd = `0${newDate.getDate()}`.slice(-2)
    var mm = `0${newDate.getMonth() + 1}`.slice(-2)
    var y = newDate.getFullYear();
    return `${y}-${mm}-${dd}`
}

const elementTypes = {
    'text': (key, inp, cls) => el(`input.${cls}`, { id: key, type: 'text', name: key, value: (inp.default ? fnOrProp(inp.default) : '')}),
    'textarea': (key, inp, cls) => el(`textarea.${cls}`, { id: key, type: 'text', name: key, value: (inp.default ? fnOrProp(inp.default) : '')}),
    'number': (key, inp, cls) => el(`input.${cls}`, { id: key, type: 'number', name: key, value: (inp.default ? fnOrProp(inp.default) : '')}),
    'select': (key, inp, cls) => el(`select.${cls}`, { id: key, name: key }, [...buildOptions(inp, inp.default || '')]),
    'date': (key, inp, cls) => el(`input.${cls}`, { id: key, type: 'date', name: key, value: (inp.default ? inputDate(fnOrProp(inp.default)) : inputDate(new Date()))}),
}

const buildOptions = (inp, selected) => {
    let opts = inp.options || [];
    return opts.reduce((arr, current) => {
        let opt = el('option', { value: current.value || current, textContent: current.text || current}); 
        if (selected == current.value) {
            opt.setAttribute('selected', true);
        }
        arr.push(opt);
        return arr;
    }, []);
}


export {
    fnOrProp,
    inputDate,
    elementTypes,
    buildOptions
}