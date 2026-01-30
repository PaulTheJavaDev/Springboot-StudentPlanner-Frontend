export function checkTextForSymbols(text) {

    var format = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~]/;
    return format.test(text)

}