exports.checkEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

exports.checkPass = (password) => {
    const combination = /[0-9]/.test(password) + /[a-zA-Z]/.test(password) + /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const len = password.length;

    if (combination > 1 && len > 7 && len < 21)
        return 0;
    if (combination > 1)
        return 1;
    if (len > 7 && len < 21)
        return 2;
    return 3;
}