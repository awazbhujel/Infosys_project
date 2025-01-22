// Helper function to display error messages
function displayErrorMessage(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.add('active');
}

// Helper function to clear error messages
function clearErrorMessage(elementId) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = '';
    errorElement.classList.remove('active');
}

// Show notification
function showNotification(message, type) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.textContent = message;
    notificationDiv.className = `notification ${type} active`;

    setTimeout(() => {
        notificationDiv.classList.remove('active');
        setTimeout(() => {
            notificationDiv.textContent = '';
        }, 300);
    }, 3000);
}

// Toggle password visibility
function togglePasswordVisibility(passwordFieldId, iconId) {
    const passwordField = document.getElementById(passwordFieldId);
    const icon = document.getElementById(iconId);

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.textContent = '🙈';
    } else {
        passwordField.type = 'password';
        icon.textContent = '👁️';
    }
}

// Toggle between sign-in and sign-up forms
function toggleFormDisplay() {
    const signInContainer = document.querySelector('.sign-in-container');
    const signUpContainer = document.querySelector('.sign-up-container');

    signInContainer.classList.toggle('inactive');
    signUpContainer.classList.toggle('active');
}

// Validate username
function validateUsername(username) {
    const cleanedUsername = username.replace(/[^a-zA-Z0-9]/g, '');

    if (cleanedUsername.length > 10) {
        return { valid: false, message: 'Username must be 10 characters or less.' };
    }

    if (cleanedUsername.length === 0) {
        return { valid: false, message: 'Username cannot be empty.' };
    }

    return { valid: true, cleanedUsername };
}

// Format email from voice input
function formatEmailFromVoice(voiceInput) {
    voiceInput = voiceInput.replace(/\b(at|attherate)\b/gi, '@').replace(/\bdot\b/gi, '.').replace(/\s+/g, '').toLowerCase();

    if (!validateEmail(voiceInput)) {
        return { valid: false, message: 'Please enter a valid email address.' };
    }

    return { valid: true, formattedEmail: voiceInput };
}

// Voice input setup
function startVoiceInput(inputId) {
    const errorId = inputId === 'email' || inputId === 'signInEmail' ? (inputId === 'email' ? 'emailError' : 'signInEmailError') :
                   inputId === 'username' ? 'usernameError' :
                   inputId === 'password' || inputId === 'signInPassword' ? (inputId === 'password' ? 'passwordError' : 'signInPasswordError') : null;

    if (errorId) {
        clearErrorMessage(errorId);
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const voiceIconId = `voiceIcon${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`;
    const voiceIcon = document.getElementById(voiceIconId);

    if (voiceIcon) {
        voiceIcon.classList.add('active');
    }

    recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;

        let validationResult;
        let cleanedValue;

        if (inputId === 'username') {
            validationResult = validateUsername(result);
            if (validationResult.valid) {
                cleanedValue = validationResult.cleanedUsername;
            }
        }
        else if (inputId === 'email' || inputId === 'signInEmail') {
            validationResult = formatEmailFromVoice(result);
           if (validationResult.valid) {
             cleanedValue = validationResult.formattedEmail;
           }
        }
          else if (inputId === 'password' || inputId === 'signInPassword') {
             const password = result;
             cleanedValue = password.replace(/\s+/g, '');
            validationResult = validatePassword(cleanedValue);
        } else {
            cleanedValue = result;
        }

         if (validationResult && !validationResult.valid) {
            displayErrorMessage(errorId, validationResult.message);
         }
        else {
           const inputField = document.getElementById(inputId);
            if (inputField) {
                inputField.value = cleanedValue;
                const inputEvent = new Event('input', { bubbles: true });
                inputField.dispatchEvent(inputEvent);
            } else {
                console.error(`Element with id "${inputId}" not found.`);
            }
        }
    };


    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        if (voiceIcon) {
            voiceIcon.classList.remove('active');
        }
    };

    recognition.onend = () => {
        if (voiceIcon) {
            voiceIcon.classList.remove('active');
        }
    };

    recognition.start();
}

// Dark mode toggle
function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
}

// Validate password format
function validatePassword(password) {
    if (/\s/.test(password)) {
        return { valid: false, message: 'Password cannot contain spaces' };
    }
    if (password.length !== 6) {
        return { valid: false, message: 'Password must be exactly 6 characters long' };
    }
    return { valid: true };
}

// Clear input field and error message
function clearInput(inputId, errorId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
        clearErrorMessage(errorId);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// Initialize event listeners
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

    // Clear button functionality
    const clearButtons = {
        'clearSignInEmail': { inputId: 'signInEmail', errorId: 'signInEmailError' },
        'clearSignInPassword': { inputId: 'signInPassword', errorId: 'signInPasswordError' },
        'clearUsername': { inputId: 'username', errorId: 'usernameError' },
        'clearEmail': { inputId: 'email', errorId: 'emailError' },
        'clearPassword': { inputId: 'password', errorId: 'passwordError' }
    };

    Object.entries(clearButtons).forEach(([clearId, { inputId, errorId }]) => {
        const clearButton = document.getElementById(clearId);
        if (clearButton) {
            clearButton.addEventListener('click', () => clearInput(inputId, errorId));
        }
    });

    // Toggle password visibility
    document.getElementById('toggleSignInPassword').addEventListener('click', () =>
        togglePasswordVisibility('signInPassword', 'toggleSignInPassword')
    );
    document.getElementById('togglePassword').addEventListener('click', () =>
        togglePasswordVisibility('password', 'togglePassword')
    );

    // Voice input
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

    // Dark mode toggle
    const toggleSwitch = document.querySelector('#checkbox');
    toggleSwitch.addEventListener('change', switchTheme);

    // Toggle forms
    document.getElementById('toggleSignUp').addEventListener('click', toggleFormDisplay);
    document.getElementById('toggleSignIn').addEventListener('click', toggleFormDisplay);

    // Real-time username validation for manual input
    const usernameInput = document.getElementById('username');
    usernameInput.addEventListener('input', (e) => {
        if(e.target){
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
    // Real-time password validation for manual input (Sign Up)
   const passwordInput = document.getElementById('password');
   passwordInput.addEventListener('input', (e) => {
    if(e.target){
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
    // Real-time password validation for manual input (Sign In)
    const signInPasswordInput = document.getElementById('signInPassword');
    signInPasswordInput.addEventListener('input', (e) => {
     if(e.target){
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

     // Real-time email validation for manual input (Sign Up)
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('input', (e) => {
     if(e.target){
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

    // Real-time email validation for manual input (Sign In)
    const signInEmailInput = document.getElementById('signInEmail');
    signInEmailInput.addEventListener('input', (e) => {
        if(e.target){
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

    // Add form submission handlers
     document.getElementById('signInForm').addEventListener('submit', async (e) => {
        e.preventDefault();
            const email = document.getElementById('signInEmail').value;
            const password = document.getElementById('signInPassword').value;


           if (!validateEmail(email)) {
                displayErrorMessage('signInEmailError', 'Please enter a valid email address');
                return;
           }
            if (!validatePassword(password).valid) {
                displayErrorMessage('signInPasswordError', 'Please enter a valid password');
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
           }
    });

   document.getElementById('signupForm').addEventListener('submit', async (e) => {
           e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

           

            if (!validateUsername(username).valid) {
                displayErrorMessage('usernameError', 'Please enter a valid username');
                return;
            }
           if (!validateEmail(email)) {
               displayErrorMessage('emailError', 'Please enter a valid email address');
                return;
           }
            if (!validatePassword(password).valid) {
                displayErrorMessage('passwordError', 'Please enter a valid password');
                 return;
            }

           try {
                const response = await fetch('/signup', {
                   method: 'POST',
                    headers: {
                       'Content-Type': 'application/json',
                  },
                    body: JSON.stringify({ username, email, password}),
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
            }
      });
});

// Validate email format (universal format)
function validateEmail(email) {
    const allowedDomains = [
        'gmail.com',
        'yahoo.com',
       'outlook.com',
        'hotmail.com',
        'aol.com',
        'icloud.com'
    ];

    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const containsLetter = /[a-zA-Z]/.test(email);

    const domain = email.split('@')[1];
    const isAllowedDomain = domain ? allowedDomains.includes(domain.toLowerCase()) : false;

    return re.test(email) && containsLetter && isAllowedDomain;
}