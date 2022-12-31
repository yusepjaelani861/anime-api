const generate = () => {
    var digits = "0123456789";
    let OTP: string = "";
    for (let i = 0; i < 6; i++ ) {
        OTP += digits[Math.floor(Math.random() * 5)];
    }

    return OTP;
}

const rand = () => {
    var digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let OTP: string = "";
    for (let i = 0; i < 6; i++ ) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }

    return OTP;
}

export {
    generate,
    rand
}