document.addEventListener('DOMContentLoaded', () => {
    // Theme switcher functionality
    const toggleSwitch = document.createElement('div');
    toggleSwitch.className = 'theme-switch-wrapper';
    toggleSwitch.innerHTML = `
        <label class="theme-switch">
            <input type="checkbox" id="checkbox">
            <div class="slider"></div>
        </label>
    `;
    document.body.appendChild(toggleSwitch);

    const checkbox = document.getElementById('checkbox');

    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
            checkbox.checked = true;
        }
    }

    // Handle theme switch
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });

    const form = document.getElementById('bank-form');
    const submitButton = document.getElementById('submit-btn');
    const signOutButton = document.getElementById('sign-out-btn');
    const toastContainer = document.getElementById('toast-container');
    let isSubmitting = false;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;
    let isListening = false;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US';
    }

    const formSchema = {
        firstName: { required: true, minLength: 2, maxLength: 255 },
        middleName: { required: false, minLength: 2, maxLength: 255 }, // Middle name is required
        lastName: { required: true, minLength: 2, maxLength: 255 },
        dob: { required: true },
        gender: { required: true, maxLength: 255 },
        maritalStatus: { required: true, maxLength: 255 },
        nationality: { required: true, minLength: 2, maxLength: 255 },
        mothersMaidenName: { required: true, minLength: 2, maxLength: 255 },
        residentialStreet: { required: true, maxLength: 255 },
        residentialCity: { required: true, maxLength: 255 },
        residentialState: { required: true, maxLength: 255 },
        residentialZip: { required: true, regex: /^\d{6}$/, message: 'ZIP code must be exactly 6 digits. Please try again.' },
        mobilePhone: { required: true, regex: /^\d{10}$/, message: 'Phone number must be exactly 10 digits. Please try again.' },
        email: { required: true, regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address.', allowedDomains: ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'] },
        employmentStatus: { required: true, maxLength: 255 },
        occupation: { required: true, minLength: 2, maxLength: 255 },
        monthlyIncome: { required: true, min: 0 },
        incomeSource: { required: true, maxLength: 255 },
        accountType: { required: true, maxLength: 255 },
        initialDeposit: { required: true, min: 0 },
        accountPurpose: { required: true, maxLength: 255 },
        modeOfOperation: { required: true, maxLength: 255 },
        nomineeName: { required: false, maxLength: 255 }, // Nominee fields are required
        nomineeRelationship: { required: false, maxLength: 255 },
        nomineeContact: { required: false, regex: /^\d{10}$/, message: 'Nominee contact must be exactly 10 digits. Please try again.' },
    };
    
    
    function validateField(fieldName, fieldValue, fieldSchema) {
        const element = document.getElementById(fieldName);
        const errorElement = element?.closest('.form-item')?.querySelector('.form-message');
    
    // Skip validation for optional fields if they are empty
    if (!fieldSchema.required && !fieldValue) {
        errorElement.textContent = ''; // Clear any previous error message
        return true; // Skip validation for optional fields
    }
    

        if (fieldSchema.required && !fieldValue) {
            errorElement.textContent = `${fieldName} is required.`;
            return false;
        }

        if (fieldSchema.regex && !fieldSchema.regex.test(fieldValue)) {
            errorElement.textContent = fieldSchema.message || `Please enter a valid ${fieldName}.`;
            return false;
        }

        if (fieldSchema.minLength && fieldValue.length < fieldSchema.minLength) {
            errorElement.textContent = `${fieldName} must be at least ${fieldSchema.minLength} characters long.`;
            return false;
        }

        if (fieldSchema.maxLength && fieldValue.length > fieldSchema.maxLength) {
            errorElement.textContent = `${fieldName} must be at most ${fieldSchema.maxLength} characters long.`;
            return false;
        }

        errorElement.textContent = ''; // Clear previous error message
        return true;
    }

    function validateForm() {
        let isValid = true;
        for (const fieldName in formSchema) {
            const fieldValue = document.getElementById(fieldName)?.value;
            const fieldSchema = formSchema[fieldName];
            if (!validateField(fieldName, fieldValue, fieldSchema)) {
                isValid = false;
            }
        }
        return isValid;
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    function clearForm() {
        form.reset();
    }

    function clearInput(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            if (input.type === "checkbox" || input.type === "radio") {
                input.checked = false;
            } else {
                input.value = '';
            }
            
            const voiceStatusText = document.getElementById(`voiceStatusText${inputId.charAt(0).toUpperCase() + inputId.slice(1)}`);
            if (voiceStatusText) {
                voiceStatusText.textContent = '';
            }
            const errorElement = input?.closest('.form-item')?.querySelector('.form-message');
            if (errorElement)
                errorElement.textContent = '';

        }
    }
    // Capitalize the first letter of each word
    function capitalizeWords(text) {
        return text
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    // Format email address from voice input
    function formatEmail(voiceInput) {
        let email = voiceInput
            .replace(/\b(at|attherate)\b/gi, '@')
            .replace(/\b(dot)\b/gi, '.');
        email = email.replace(/\s+/g, '');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return null;
        }
        return email.toLowerCase();
    }
    // Function to update voice status messages
    function updateVoiceStatus(elementId, message) {
        const statusTextElement = document.getElementById(`voiceStatusText${elementId.charAt(0).toUpperCase() + elementId.slice(1)}`);
        if (statusTextElement) {
            statusTextElement.textContent = message;
            statusTextElement.className = `voice-status-text ${message.toLowerCase().includes("listening") ? "listening" : message.toLowerCase().includes("mic stopped") ? "mic-stopped" : message.toLowerCase().includes("error") ? "error" : ""}`;
        }
    }

    function convertWordsToNumber(transcript) {
        const numberWords = {
            zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
            ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
            seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
            sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, lakh: 100000,
            crore: 10000000,
        };
    
        const similarWordsMap = {
            'handred': 'hundred', 'thousend': 'thousand', 'thousant': 'thousand',
            'lac': 'lakh', 'lack': 'lakh', 'laks': 'lakh', 'cror': 'crore', 'cr': 'crore',
        };
    
        // Replace similar words with correct ones
        for (const [similarWord, correctWord] of Object.entries(similarWordsMap)) {
            transcript = transcript.replace(new RegExp(similarWord, 'gi'), correctWord);
        }
    
        const words = transcript.toLowerCase().split(' ');
        let total = 0;
        let currentGroupValue = 0;
    
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
    
            if (numberWords[word] !== undefined) {
                const value = numberWords[word];
    
                if (word === 'hundred') {
                    currentGroupValue *= value;
                } else if (word === 'thousand' || word === 'lakh' || word === 'crore') {
                    // Handle cases like "1 lakh", "2 crore", etc.
                    if (currentGroupValue === 0) {
                        currentGroupValue = 1; // Default to 1 if no number precedes the multiplier
                    }
                    currentGroupValue *= value;
                    total += currentGroupValue;
                    currentGroupValue = 0; // Reset for the next group
                } else {
                    currentGroupValue += value; // Add to the current group
                }
            } else if (word === 'and') {
                continue; // Skip "and" in phrases like "one hundred and twenty"
            } else if (!isNaN(word)) {
                currentGroupValue += parseFloat(word.replace(/,/g, '')); // Handle numeric digits
            }
        }
    
        total += currentGroupValue; // Add any remaining value in the current group
        return total;
    }
    

    // Voice input functionality
    function handleVoiceInput(inputField, micIcon) {
        if (isListening) {
            if (recognition) {
                recognition.stop();
            }
            updateVoiceStatus(inputField.id, "Mic stopped");
            isListening = false;
            return;
        }
        if (recognition) {
            micIcon.classList.add('active');
            recognition.start();
            isListening = true;
            updateVoiceStatus(inputField.id, "Listening...");

            recognition.onresult = (event) => {
                let transcript = event.results[0][0].transcript.toLowerCase();
                let formattedDate = null;

                if (inputField.id === 'gender' && transcript.includes('mail')) {
                    transcript = transcript.replace(/mail/gi, 'Male');
               }

                if (inputField.id === 'residentialStreet') {
                    const commaVariations = ['comma', 'coma', 'comah'];
                    for (const variation of commaVariations) {
                        if (transcript.includes(variation)) {
                            transcript = transcript.replace(new RegExp(variation, 'gi'), ',');
                        }
                    }
                }
                // Handle numeric fields (monthlyIncome, initialDeposit)
                if (inputField.id === 'monthlyIncome' || inputField.id === 'initialDeposit') {
                    const numericValue = convertWordsToNumber(transcript);
                    if (!isNaN(numericValue)) {
                        inputField.value = numericValue;
                    } else {
                        showToast('Invalid number format. Please try again.', 'error');
                        updateVoiceStatus(inputField.id, "Error: Mic stopped");
                    }
                }
                if (inputField.id === 'dob') {
                    const datePatterns = [
                        /(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/, // DD-MM-YYYY or DD/MM/YYYY
                        /(\d{4})[\/\-\s](\d{1,2})[\/\-\s](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
                        /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i, // DD Month YYYY
                        /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/ // DD MM YYYY
                    ];
                
                    for (const pattern of datePatterns) {
                        const match = transcript.match(pattern);
                        if (match) {
                            let year, month, day;
                
                            if (pattern === datePatterns[0]) {
                                // DD-MM-YYYY or DD/MM/YYYY
                                day = match[1].padStart(2, '0');
                                month = match[2].padStart(2, '0');
                                year = match[3];
                            } else if (pattern === datePatterns[1]) {
                                // YYYY-MM-DD or YYYY/MM/DD
                                year = match[1];
                                month = match[2].padStart(2, '0');
                                day = match[3].padStart(2, '0');
                            } else if (pattern === datePatterns[2]) {
                                // DD Month YYYY
                                day = match[1].padStart(2, '0');
                                month = String(new Date(`${match[2]} 1, 2000`).getMonth() + 1).padStart(2, '0');
                                year = match[3];
                            } else if (pattern === datePatterns[3]) {
                                // DD MM YYYY
                                day = match[1].padStart(2, '0');
                                month = match[2].padStart(2, '0');
                                year = match[3];
                            }
                
                            // Format the date as DD-MM-YYYY
                            formattedDate = `${day}-${month}-${year}`;
                            break;
                        }
                    }
                
                    if (formattedDate) {
                        inputField.value = formattedDate;
                    } else {
                        showToast('Invalid date format. Please try again.', 'error');
                        updateVoiceStatus(inputField.id, "Error: Mic stopped");
                    }
                }
                else if (inputField.id === 'mobilePhone' || inputField.id === 'residentialZip' || inputField.id === 'nomineeContact') {
                    let digitsOnly = transcript.replace(/\D/g, '');
                    if ((inputField.id === 'mobilePhone' || inputField.id === 'nomineeContact') && digitsOnly.length !== 10) {
                        showToast('Phone number must be exactly 10 digits. Please try again.', 'error');
                        updateVoiceStatus(inputField.id, "Error: Mic stopped");
                        return;
                    }
                    if (inputField.id === 'residentialZip' && digitsOnly.length !== 6) {
                        showToast('ZIP code must be exactly 6 digits. Please try again.', 'error');
                        updateVoiceStatus(inputField.id, "Error: Mic stopped");
                        return;
                    }
                    inputField.value = digitsOnly;
                }
                else if (inputField.id === 'email') {
                    const formattedEmail = formatEmail(transcript);
                    if (formattedEmail) {
                        inputField.value = formattedEmail;
                    } else {
                        showToast('Invalid email format. Please try again.', 'error');
                        updateVoiceStatus(inputField.id, "Error: Mic stopped");
                    }
                } else {
                    inputField.value = capitalizeWords(transcript);
                }
                micIcon.classList.remove('active');
                updateVoiceStatus(inputField.id, "");
                isListening = false;
                recognition.stop();
            };

            recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                micIcon.classList.remove('active');
                showToast('Voice input failed. Please try again.', 'error');
                updateVoiceStatus(inputField.id, "Error: Mic stopped");
                isListening = false;
                recognition.stop();
            };

            recognition.onend = () => {
                micIcon.classList.remove('active');
                isListening = false;
            };
        }
    }

    const micIcons = document.querySelectorAll('.mic-icon');
    micIcons.forEach((micIcon) => {
        micIcon.addEventListener('click', () => {
            const inputField = micIcon.parentElement.querySelector('.form-control');
            handleVoiceInput(inputField, micIcon);
        });
    });
    const clearInputButtons = document.querySelectorAll('.clear-input');
    clearInputButtons.forEach(button => {
        button.addEventListener('click', () => {
            const inputId = button.getAttribute('data-input');
            clearInput(inputId);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loader = document.querySelector('.loader');
        const loaderOverlay = document.querySelector('.loader-overlay');
        if (loader) loader.style.display = 'block';
        if (loaderOverlay) loaderOverlay.style.display = 'block';
        if (isSubmitting) return;
        isSubmitting = true;
        submitButton.textContent = 'Submitting...';

        if (!validateForm()) {
            submitButton.textContent = 'Submit Application';
            if (loader) loader.style.display = 'none';
            if (loaderOverlay) loaderOverlay.style.display = 'none';
            isSubmitting = false;
            return;
        }

        const formValues = {};
        for (const fieldName in formSchema) {
            formValues[fieldName] = document.getElementById(fieldName)?.value;
            if (typeof formValues[fieldName] === 'string') {
                formValues[fieldName] = formValues[fieldName].trim();
            }
        }

        // Log the form data being sent
        console.log("Form Data Being Sent:", formValues);

        if (formValues.monthlyIncome) {
            formValues.monthlyIncome = parseFloat(formValues.monthlyIncome);
        }
        if (formValues.initialDeposit) {
            formValues.initialDeposit = parseFloat(formValues.initialDeposit);
        }

        try {
            const authResponse = await fetch('/check-auth');
            const authData = await authResponse.json();

            if (!authResponse.ok || !authData.isAuthenticated) {
                if (loader) loader.style.display = 'none';
                if (loaderOverlay) loaderOverlay.style.display = 'none';
                window.location.href = '/auth/auth_form.html';
                return;
            }

            const submitResponse = await fetch('/submit-bank-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formValues),
            });

            if (submitResponse.ok) {
                showToast(`Your application has been submitted successfully, Please check your mail.`, 'success');
                clearForm();
            } else {
                showToast('Form submission failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error during form submission:', error);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            submitButton.textContent = 'Submit Application';
            isSubmitting = false;
            if (loader) loader.style.display = 'none';
            if (loaderOverlay) loaderOverlay.style.display = 'none';
        }
    });

    async function checkAuth() {
        try {
            const response = await fetch('/check-auth');
            const data = await response.json();
            if (!response.ok || !data.isAuthenticated) {
                window.location.href = '/auth/auth_form.html';
            } else {
                showToast(`Welcome back ${data.username}`, 'success');
            }
        } catch (error) {
            console.log('There is some issue in authentication', error);
            window.location.href = '/auth/auth_form.html';
        }
    }
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

    signOutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/sign-out', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/auth/auth_form.html';
            } else {
                showToast('Failed to sign out.', 'error');
                console.error('Failed to sign out:', response.statusText);
            }
        } catch (error) {
            console.error('Error during sign out:', error);
            showToast('An error occurred during sign out.', 'error');
        }
    });

    checkAuth();


        function restrictInput(inputElement, type = 'text') {
            inputElement.addEventListener('input', function (event) {
              let value = event.target.value;
              if (type === 'number') {
                  value = value.replace(/\D/g, '');
                if (inputElement.id === 'mobilePhone' || inputElement.id === 'nomineeContact') {
                  if (value.length > 10)
                      value = value.slice(0, 10);
                  } else if( inputElement.id === 'residentialZip' ){
                    if (value.length > 6)
                      value = value.slice(0, 6);
                   }
                  event.target.value = value;
              } else if(type === 'text'){
                value = value.replace(/[^A-Za-z\s]/g, '');
                event.target.value = value;
              }
            });
        }

          // Apply for number fields:
           const numberFields = ['mobilePhone', 'residentialZip','nomineeContact'];
           numberFields.forEach(id => {
             const element = document.getElementById(id);
             if (element) {
                 restrictInput(element, 'number');
             }
           });


            // Apply text-only restrictions:
           const textOnlyFields = [
            'firstName', 'middleName', 'lastName', 'gender', 'maritalStatus', 'nationality',
           'mothersMaidenName', 'residentialCity', 'residentialState', 'employmentStatus',
           'occupation', 'incomeSource', 'accountType', 'accountPurpose',
           'modeOfOperation', 'nomineeName', 'nomineeRelationship'
         ];

          textOnlyFields.forEach(id => {
             const element = document.getElementById(id);
             if (element) {
                restrictInput(element, 'text');
             }
         });
});

// Additional functionality from bank_script.js
document.addEventListener('DOMContentLoaded', () => {
    // Additional date formatting and validation for the dob field
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        dobInput.addEventListener('input', function (event) {
            const value = event.target.value;
            const regex = /^(\d{0,2})(-(\d{0,2})(-(\d{0,4}))?)?$/; // Regex for DD-MM-YYYY
            if (!regex.test(value)) {
                event.target.value = value.slice(0, value.length - 1);
                return;
            }
            const yearPart = value.split('-')[2];
            if (yearPart && yearPart.length > 4) {
                event.target.value = value.slice(0, value.length - 1);
                return;
            }
        });
    }


    // Additional validation for the dob field during form submission
    const form = document.getElementById('bank-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            const dobElement = document.getElementById('dob');
            if (dobElement) {
                const dobValue = dobElement.value;
                const dobRegex = /^\d{2}-\d{2}-\d{4}$/; // Regex for DD-MM-YYYY format
                if (!dobRegex.test(dobValue)) {
                    showToast('Invalid date format. Please use DD-MM-YYYY', 'error');
                    e.preventDefault();
                }
            }
        });
    }
});