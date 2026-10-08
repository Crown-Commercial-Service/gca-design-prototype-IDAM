class PasswordStrengthTest {
    $passwordStrengthTest;
    constructor($passwordStrengthTest) {
        this.$passwordStrengthTest = $passwordStrengthTest;
    }
    init() {
        this.$passwordStrengthTest.addClass('ccs-password-strength-tests__wrong');
    }
    testPasswordInput(passwordInputText) {
        const testPassed = this.test.test(passwordInputText);
        this.$passwordStrengthTest.toggleClass('ccs-password-strength-tests__wrong', !testPassed);
        this.$passwordStrengthTest.toggleClass('ccs-password-strength-tests__correct', testPassed);
    }
}
class PasswordStrengthTestLength extends PasswordStrengthTest {
    test;
    constructor($passwordStrengthTest, value) {
        super($passwordStrengthTest);
        this.test = new RegExp(`^.{${value},}`);
    }
}
class PasswordStrengthTestSymbol extends PasswordStrengthTest {
    test;
    constructor($passwordStrengthTest, value) {
        super($passwordStrengthTest);
        this.test = new RegExp(`^(?=.*?[${value}])`);
    }
}
class PasswordStrengthTestNumber extends PasswordStrengthTest {
    test;
    constructor($passwordStrengthTest) {
        super($passwordStrengthTest);
        this.test = new RegExp('^(?=.*[0-9])');
    }
}
class PasswordStrengthTestUppercase extends PasswordStrengthTest {
    test;
    constructor($passwordStrengthTest) {
        super($passwordStrengthTest);
        this.test = new RegExp('^(?=.*[A-Z])');
    }
}
class PasswordStrengthTestLowercase extends PasswordStrengthTest {
    test;
    constructor($passwordStrengthTest) {
        super($passwordStrengthTest);
        this.test = new RegExp('^(?=.*[a-z])');
    }
}
const passwordStrengthTestFactory = ($passwordStrengthTest) => {
    const testType = $passwordStrengthTest.data('testType');
    const value = $passwordStrengthTest.data('testValue');
    switch (testType) {
        case 'length':
            return new PasswordStrengthTestLength($passwordStrengthTest, value);
        case 'symbol':
            return new PasswordStrengthTestSymbol($passwordStrengthTest, value);
        case 'number':
            return new PasswordStrengthTestNumber($passwordStrengthTest);
        case 'uppercase':
            return new PasswordStrengthTestUppercase($passwordStrengthTest);
        case 'lowercase':
            return new PasswordStrengthTestLowercase($passwordStrengthTest);
    }
};
class PasswordStrength {
    static moduleName = 'ccs-password-strength';
    $passwordStrength;
    $passwordInput;
    passwordStrengthTests;
    constructor($passwordStrength) {
        this.$passwordStrength = $passwordStrength;
        this.$passwordInput = $(`#${$passwordStrength.data('target')}`);
        this.passwordStrengthTests = this.$passwordStrength.find('.ccs-password-strength-test').get().map((passwordStrengthTest) => passwordStrengthTestFactory($(passwordStrengthTest)));
    }
    init() {
        if (this.$passwordInput.length) {
            this.$passwordStrength.addClass('ccs-password-strength-tests');
            this.passwordStrengthTests.forEach((passwordStrengthTest) => passwordStrengthTest.init());
            this.$passwordInput.on('keyup', () => { this.testPasswordInput(); });
        }
    }
    testPasswordInput() {
        const passwordInputText = String(this.$passwordInput.val());
        this.passwordStrengthTests.forEach((passwordStrengthTest) => passwordStrengthTest.testPasswordInput(passwordInputText));
    }
}

export { PasswordStrength };
//# sourceMappingURL=password-strength.bundle.mjs.map
