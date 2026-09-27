function success(message) {

    console.log(
        `✔ ${message}`
    );

}


function error(message) {

    console.error(
        `✖ ${message}`
    );

}


function warning(message) {

    console.error(
        `⚠ ${message}`
    );

}


module.exports = {

    success,

    error,

    warning

};