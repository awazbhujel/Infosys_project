let isListening = false;
let recognition = null;

function hideLoader() {
    const loader = document.querySelector('.loader');
    const loaderOverlay = document.querySelector('.loader-overlay');
    if (loader) loader.style.display = 'none';
    if (loaderOverlay) loaderOverlay.style.display = 'none';
}

function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
    }
}

function clearErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('active');
    }
}

function togglePasswordVisibility(passwordFieldId, iconId) {
    const passwordField = document.getElementById(passwordFieldId);
    const icon = document.getElementById(iconId);

    if (passwordField && icon) {
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.textContent = '🙈';
        } else {
            passwordField.type = 'password';
            icon.textContent = '👁️';
        }
    }
}

document.getElementById('forgotPasswordLink')?.addEventListener('click', () => {
    document.getElementById('forgotPasswordModal').style.display = 'block';
});

document.querySelector('.close')?.addEventListener('click', () => {
    document.getElementById('forgotPasswordModal').style.display = 'none';
});

document.getElementById('voiceIconForgotPasswordEmail')?.addEventListener('click', () => {
    const inputId = 'forgotPasswordEmail';
    startVoiceInput(inputId);
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('forgotPasswordModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function showNotification(message, type) {
    const notificationDiv = document.getElementById('notification');
    if (notificationDiv) {
        notificationDiv.textContent = message;
        notificationDiv.className = `notification ${type} active`;

        setTimeout(() => {
            notificationDiv.classList.remove('active');
            setTimeout(() => {
                notificationDiv.textContent = '';
            }, 300);
        }, 3000);
    }
}

document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loader = document.querySelector('.loader');
    const loaderOverlay = document.querySelector('.loader-overlay');
    if (loader) loader.style.display = 'block';
    if (loaderOverlay) loaderOverlay.style.display = 'block';

    const forgotPasswordEmail = document.getElementById('forgotPasswordEmail').value;
    const forgotPasswordEmailInput = document.getElementById('forgotPasswordEmail');

    if (forgotPasswordEmailInput) {
        const email = forgotPasswordEmail.toLowerCase();
        const cleanedEmail = email.replace(/\s+/g, '');

        if (!validateEmail(cleanedEmail)) {
            const domain = cleanedEmail.split('@')[1];
            let errorMessage = 'Please enter a valid email address';
            if (domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
                errorMessage = 'Invalid email format';
            } else if (domain && !/[a-zA-Z]/.test(cleanedEmail)) {
                errorMessage = 'Email must contain at least one letter';
            } else if (domain) {
                errorMessage = 'Only gmail.com, yahoo.com, outlook.com, hotmail.com, aol.com, and icloud.com domains are allowed';
            }
            displayErrorMessage('forgotPasswordEmailError', errorMessage);
            if (loader) loader.style.display = 'none';
            if (loaderOverlay) loaderOverlay.style.display = 'none';
            return;
        } else {
            clearErrorMessage('forgotPasswordEmailError');
        }
    }

    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: forgotPasswordEmail }),
        });

        const data = await response.json();
        showNotification(data.message, response.ok ? 'success' : 'error');

        if (response.ok) {
            document.getElementById('forgotPasswordModal').style.display = 'none';
        }
    } catch (error) {
        showNotification(`Error: ${error}`, 'error');
    } finally {
        if (loader) loader.style.display = 'none';
        if (loaderOverlay) loaderOverlay.style.display = 'none';
    }
});

document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loader = document.querySelector('.loader');
    const loaderOverlay = document.querySelector('.loader-overlay');
    if (loader) loader.style.display = 'block';
    if (loaderOverlay) loaderOverlay.style.display = 'block';

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const resetToken = document.getElementById('resetToken').value;

    if (newPassword !== confirmPassword) {
        displayErrorMessage('confirmPasswordError', 'Passwords do not match');
        hideLoader();
        return;
    }

    if (newPassword.length !== 6) {
        showNotification("Password must be exactly 6 characters long.", 'error');
        hideLoader();
        return;
    }

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: resetToken, newPassword }),
        });

        const data = await response.json();

        if (response.ok) {
            showNotification(data.message, 'success');

            // Keep the loader visible for 5 seconds, then hide it and redirect
            setTimeout(() => {
                hideLoader(); // Hide the loader
                window.location.href = '/auth/auth_form.html'; // Redirect to login page
            }, 5000); // 5 seconds delay
        } else {
            showNotification(data.message, 'error');
            hideLoader(); // Hide the loader if there's an error
        }
    } catch (error) {
        showNotification(`Error: ${error}`, 'error');
        hideLoader(); // Hide the loader if there's an error
    }
});

function toggleFormDisplay() {
    const signInContainer = document.querySelector('.sign-in-container');
    const signUpContainer = document.querySelector('.sign-up-container');

    if (signInContainer && signUpContainer) {
        signInContainer.classList.toggle('inactive');
        signUpContainer.classList.toggle('active');
    }
}

function validateUsername(username) {
    const cleanedUsername = username.replace(/[^a-zA-Z0-9]/g, '').replace(/\s+/g, '');

    if (cleanedUsername.length > 10) {
        return { valid: false, message: 'Username must be 10 characters or less.' };
    }

    if (cleanedUsername.length === 0) {
        return { valid: false, message: 'Username cannot be empty.' };
    }

    return { valid: true, cleanedUsername };
}

function formatEmailFromVoice(voiceInput) {
    voiceInput = voiceInput
        .replace(/\b(at|attherate)\b/gi, '@')
        .replace(/\bdot\b/gi, '.')
        .replace(/\s+/g, '')
        .toLowerCase();

    if (!validateEmail(voiceInput)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }

    return { valid: true, formattedEmail: voiceInput };
}

function updateVoiceStatus(elementId, message) {
    const statusTextElement = document.getElementById(`voiceStatusText${elementId.charAt(0).toUpperCase() + elementId.slice(1)}`);
    if (statusTextElement) {
        statusTextElement.textContent = message;
        statusTextElement.className = `voice-status-text ${message.toLowerCase().includes("listening") ? "listening" : ""}`;
    }
}

function startVoiceInput(inputId) {
    const errorId =
        inputId === 'email' ? 'emailError' :
            inputId === 'signInEmail' ? 'signInEmailError' :
                inputId === 'username' ? 'usernameError' :
                    inputId === 'password' ? 'passwordError' :
                        inputId === 'signInPassword' ? 'signInPasswordError' :
                            inputId === 'forgotPasswordEmail' ? 'forgotPasswordEmailError' : null;

    if (errorId) {
        clearErrorMessage(errorId);
    }

    if (isListening) {
        if (recognition) {
            recognition.stop();
        }
        updateVoiceStatus(inputId, "Mic stopped");
        isListening = false;
        return;
    }

    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        isListening = true;
        updateVoiceStatus(inputId, "Listening...");
    };

    recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        console.log("Voice input result:", result);

        let validationResult;
        let cleanedValue;

        if (inputId === 'username') {
            validationResult = validateUsername(result);
            if (validationResult.valid) {
                cleanedValue = validationResult.cleanedUsername;
                const postValidation = validateUsername(cleanedValue);
                if (!postValidation.valid) {
                    displayErrorMessage(errorId, postValidation.message);
                    updateVoiceStatus(inputId, "failed");
                    return;
                }
            }
        }
        else if (inputId === 'email' || inputId === 'signInEmail' || inputId === 'forgotPasswordEmail') {
            validationResult = formatEmailFromVoice(result);
            if (validationResult.valid) {
                cleanedValue = validationResult.formattedEmail;
                if (!validateEmail(cleanedValue)) {
                    displayErrorMessage(errorId, 'Please enter a valid email address');
                    updateVoiceStatus(inputId, "failed");
                    return;
                }
            }
        }
        else if (inputId === 'password' || inputId === 'signInPassword') {
            const password = result;
            cleanedValue = password.replace(/\s+/g, '');
            validationResult = validatePassword(cleanedValue);
            if (!validationResult.valid) {
                displayErrorMessage(errorId, validationResult.message);
                updateVoiceStatus(inputId, "failed");
                return;
            }
            if (cleanedValue.length !== 6) {
                displayErrorMessage(errorId, "Password must be exactly 6 characters long");
                updateVoiceStatus(inputId, "failed");
                return;
            }
        } else {
            cleanedValue = result;
        }

        if (validationResult && !validationResult.valid) {
            displayErrorMessage(errorId, validationResult.message);
            updateVoiceStatus(inputId, "failed");
        } else {
            const inputField = document.getElementById(inputId);
            if (inputField) {
                inputField.value = cleanedValue;
                const inputEvent = new Event('input', { bubbles: true });
                const changeEvent = new Event('change', { bubbles: true });
                inputField.dispatchEvent(inputEvent);
                inputField.dispatchEvent(changeEvent);

                if (inputId === 'username') {
                    const { valid, message } = validateUsername(inputField.value);
                    if (!valid) {
                        displayErrorMessage(errorId, message);
                        updateVoiceStatus(inputId, "failed");
                    } else {
                        clearErrorMessage(errorId);
                        updateVoiceStatus(inputId, "");
                    }
                }
                else if (inputId === 'email' || inputId === 'signInEmail' || inputId === 'forgotPasswordEmail') {
                    if (!validateEmail(inputField.value)) {
                        displayErrorMessage(errorId, 'Please enter a valid email address');
                        updateVoiceStatus(inputId, "failed");
                    } else {
                        clearErrorMessage(errorId);
                        updateVoiceStatus(inputId, "");
                    }
                }
                else if (inputId === 'password' || inputId === 'signInPassword') {
                    const { valid, message } = validatePassword(inputField.value);
                    if (!valid) {
                        displayErrorMessage(errorId, message);
                        updateVoiceStatus(inputId, "failed");
                    } else {
                        clearErrorMessage(errorId);
                        updateVoiceStatus(inputId, "");
                    }
                }
                else {
                    updateVoiceStatus(inputId, "");
                }
            }
        }
        isListening = false;
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        updateVoiceStatus(inputId, "Error: Mic stopped");
        isListening = false;
    };

    recognition.onend = () => {
        isListening = false;
    };

    recognition.start();
}

function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

function validatePassword(password) {
    if (/\s/.test(password)) {
        return { valid: false, message: 'Password cannot contain spaces' };
    }
    if (password.length !== 6) {
        return { valid: false, message: 'Password must be exactly 6 characters long' };
    }
    return { valid: true };
}

function clearInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
        clearErrorMessage(errorId);
        const voiceStatusText = document.getElementById(`voiceStatusText${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
        if (voiceStatusText) {
            voiceStatusText.textContent = '';
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/static/service-worker.js')
                .then(registration => {
                    console.log('Service worker registered:', registration);
                })
                .catch(registrationError => {
                    console.log('Service worker registration failed:', registrationError);
                });
        });
    }

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        const toggleSwitch = document.querySelector('#checkbox');
        if (currentTheme === 'dark') {
            toggleSwitch.checked = true;
        }
    }

    const clearResetPasswordButtons = {
        'clearNewPassword': { inputId: 'newPassword', errorId: 'newPasswordError' },
        'clearConfirmPassword': { inputId: 'confirmPassword', errorId: 'confirmPasswordError' }
    };

    Object.entries(clearResetPasswordButtons).forEach(([clearId, { inputId, errorId }]) => {
        const clearButton = document.getElementById(clearId);
        if (clearButton) {
            clearButton.addEventListener('click', () => clearInput(inputId, errorId));
        }
    });

    document.getElementById('toggleNewPassword')?.addEventListener('click', () =>
        togglePasswordVisibility('newPassword', 'toggleNewPassword')
    );
    document.getElementById('toggleConfirmPassword')?.addEventListener('click', () =>
        togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword')
    );

    const voiceIconsResetPassword = ['voiceIconNewPassword', 'voiceIconConfirmPassword'];
    voiceIconsResetPassword.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', () => {
                const inputId = id.replace('voiceIcon', '').charAt(0).toLowerCase() + id.replace('voiceIcon', '').slice(1);
                startVoiceInput(inputId);
            });
        }
    });

    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', (e) => {
            if (e.target) {
                const password = e.target.value;
                const cleanedPassword = password.replace(/\s+/g, '');
                const { valid, message } = validatePassword(cleanedPassword);

                if (!valid) {
                    displayErrorMessage('newPasswordError', message);
                } else {
                    clearErrorMessage('newPasswordError');
                }

                if (password !== cleanedPassword) {
                    e.target.value = cleanedPassword;
                }
            }
        });
    }

    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', (e) => {
            if (e.target) {
                const confirmPassword = e.target.value;
                const newPassword = document.getElementById('newPassword').value;

                if (confirmPassword !== newPassword) {
                    displayErrorMessage('confirmPasswordError', 'Passwords do not match');
                } else {
                    clearErrorMessage('confirmPasswordError');

                }
                const password = e.target.value;
                const cleanedPassword = password.replace(/\s+/g, '');
                const { valid, message } = validatePassword(cleanedPassword);

                if (!valid) {
                    displayErrorMessage('confirmPasswordError', message);
                } else {
                    clearErrorMessage('confirmPasswordError');
                }

                if (password !== cleanedPassword) {
                    e.target.value = cleanedPassword;
                }
            }
        });
    }


    const clearButtons = {
        'clearSignInEmail': { inputId: 'signInEmail', errorId: 'signInEmailError' },
        'clearSignInPassword': { inputId: 'signInPassword', errorId: 'signInPasswordError' },
        'clearUsername': { inputId: 'username', errorId: 'usernameError' },
        'clearEmail': { inputId: 'email', errorId: 'emailError' },
        'clearPassword': { inputId: 'password', errorId: 'passwordError' },
        'clearForgotPasswordEmail': { inputId: 'forgotPasswordEmail', errorId: 'forgotPasswordEmailError' }
    };

    Object.entries(clearButtons).forEach(([clearId, { inputId, errorId }]) => {
        const clearButton = document.getElementById(clearId);
        if (clearButton) {
            clearButton.addEventListener('click', () => clearInput(inputId, errorId));
        }
    });

    document.getElementById('toggleSignInPassword')?.addEventListener('click', () =>
        togglePasswordVisibility('signInPassword', 'toggleSignInPassword')
    );
    document.getElementById('togglePassword')?.addEventListener('click', () =>
        togglePasswordVisibility('password', 'togglePassword')
    );

    const voiceIcons = ['voiceIconSignInEmail', 'voiceIconSignInPassword', 'voiceIconUsername', 'voiceIconEmail', 'voiceIconPassword'];
    voiceIcons.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', () => {
                const inputId = id.replace('voiceIcon', '').charAt(0).toLowerCase() + id.replace('voiceIcon', '').slice(1);
                startVoiceInput(inputId);
            });
        }
    });

    const toggleSwitch = document.querySelector('#checkbox');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', switchTheme);
    }

    document.getElementById('toggleSignUp')?.addEventListener('click', toggleFormDisplay);
    document.getElementById('toggleSignIn')?.addEventListener('click', toggleFormDisplay);

    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            if (e.target) {
                const { valid, message, cleanedUsername } = validateUsername(e.target.value);

                if (!valid) {
                    displayErrorMessage('usernameError', message);
                    e.target.value = cleanedUsername.slice(0, 10);
                } else {
                    clearErrorMessage('usernameError');
                    e.target.value = cleanedUsername.slice(0, 10);
                }
            }
        });
    }

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            if (e.target) {
                const password = e.target.value;
                const cleanedPassword = password.replace(/\s+/g, '');
                const { valid, message } = validatePassword(cleanedPassword);

                if (!valid) {
                    displayErrorMessage('passwordError', message);
                } else {
                    clearErrorMessage('passwordError');
                }

                if (password !== cleanedPassword) {
                    e.target.value = cleanedPassword;
                }
            }
        });
    }

    const signInPasswordInput = document.getElementById('signInPassword');
    if (signInPasswordInput) {
        signInPasswordInput.addEventListener('input', (e) => {
            if (e.target) {
                const password = e.target.value;
                const cleanedPassword = password.replace(/\s+/g, '');
                const { valid, message } = validatePassword(cleanedPassword);

                if (!valid) {
                    displayErrorMessage('signInPasswordError', message);
                } else {
                    clearErrorMessage('signInPasswordError');
                }

                if (password !== cleanedPassword) {
                    e.target.value = cleanedPassword;
                }
            }
        });
    }

    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', (e) => {
            if (e.target) {
                const email = e.target.value.toLowerCase();
                const cleanedEmail = email.replace(/\s+/g, '');

                if (!validateEmail(cleanedEmail)) {
                    const domain = cleanedEmail.split('@')[1];
                    let errorMessage = 'Please enter a valid email address';
                    if (domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
                        errorMessage = 'Invalid email format';
                    } else if (domain && !/[a-zA-Z]/.test(cleanedEmail)) {
                        errorMessage = 'Email must contain at least one letter';
                    } else if (domain) {
                        errorMessage = 'Only gmail.com, yahoo.com, outlook.com, hotmail.com, aol.com, and icloud.com domains are allowed';
                    }
                    displayErrorMessage('emailError', errorMessage);
                } else {
                    clearErrorMessage('emailError');
                }

                e.target.value = cleanedEmail;
            }
        });
    }

    const signInEmailInput = document.getElementById('signInEmail');
    if (signInEmailInput) {
        signInEmailInput.addEventListener('input', (e) => {
            if (e.target) {
                const email = e.target.value.toLowerCase();
                const cleanedEmail = email.replace(/\s+/g, '');

                if (!validateEmail(cleanedEmail)) {
                    const domain = cleanedEmail.split('@')[1];
                    let errorMessage = 'Please enter a valid email address';
                    if (domain && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
                        errorMessage = 'Invalid email format';
                    } else if (domain && !/[a-zA-Z]/.test(cleanedEmail)) {
                        errorMessage = 'Email must contain at least one letter';
                    } else if (domain) {
                        errorMessage = 'Only gmail.com, yahoo.com, outlook.com, hotmail.com, aol.com, and icloud.com domains are allowed';
                    }
                    displayErrorMessage('signInEmailError', errorMessage);
                } else {
                    clearErrorMessage('signInEmailError');
                }
                e.target.value = cleanedEmail;
            }
        });
    }

    document.getElementById('signInForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('signin form submit event triggered');
          const loader = document.querySelector('.loader');
    const loaderOverlay = document.querySelector('.loader-overlay');
    if(loader) loader.style.display = 'block';
     if(loaderOverlay) loaderOverlay.style.display = 'block';

        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;

        if (!validateEmail(email)) {
            displayErrorMessage('signInEmailError', 'Please enter a valid email address');
            hideLoader();
            return;
        }
        if (!validatePassword(password).valid) {
            displayErrorMessage('signInPasswordError', 'Please enter a valid password');
            hideLoader();
            return;
        }

        try {
            const response = await fetch('/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                showNotification(data.message, 'success');
                setTimeout(() => {
                    window.location.href = '/bankform/bank_form.html';
                }, 1000);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification(`Error: ${error}`, 'error');
        } finally {
            hideLoader();
        }
    });

    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
         const loader = document.querySelector('.loader');
    const loaderOverlay = document.querySelector('.loader-overlay');
    if(loader) loader.style.display = 'block';
     if(loaderOverlay) loaderOverlay.style.display = 'block';


        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!validateUsername(username).valid) {
            displayErrorMessage('usernameError', 'Please enter a valid username');
            hideLoader();
            return;
        }
        if (!validateEmail(email)) {
            displayErrorMessage('emailError', 'Please enter a valid email address');
            hideLoader();
            return;
        }
        if (!validatePassword(password).valid) {
            displayErrorMessage('passwordError', 'Please enter a valid password');
            hideLoader();
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                showNotification(data.message, 'success');
                setTimeout(() => {
                    toggleFormDisplay();
                }, 1000);
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            showNotification(`Error: ${error}`, 'error');
        } finally {
            hideLoader();
        }
    });
});


function validateEmail(email) {
    const allowedDomains = [
        'gmail.com',
        'yahoo.com',
        'outlook.com',
        'hotmail.com',
        'aol.com',
        'icloud.com',
        'edu.in'
    ];

    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const containsLetter = /[a-zA-Z]/.test(email);

    const domain = email.split('@')[1];
    const isAllowedDomain = domain ? allowedDomains.includes(domain.toLowerCase()) : false;

    return re.test(email) && containsLetter && isAllowedDomain;
}