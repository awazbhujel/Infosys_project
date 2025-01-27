# Beyond-QWERTY: Form-Filling Project

 [Click Here For Live Demo](https://voice-bank-form.onrender.com/)

# **Note:** 
It may take time to go live for the first try as the server goes to sleep when inactive. A new request wakes up the service (cold start), which takes a few seconds. You might encounter a 502 (Bad Gateway error), in which case please try again after a few minutes.


# Project Description
This project develops a voice-enabled, cross-platform solution for simplifying bank account application form completion.  It consists of a web application and an Android application (APK) built from the same codebase.

**Key Features:**

# **Web Application:**

* **Secure User Authentication:**
    * User sign-up and sign-in with email, password, and username.
    * Password hashing using bcrypt for security.
    * Session management to maintain user login status.
    * Forgot Password functionality with a time-limited reset token.
* **Interactive Bank Account Application Form:**
    * Comprehensive form with sections for personal, contact, employment, income, account details, and nominee information.
    * Voice input support for all text input fields using JavaScript's Speech Recognition API.
    * Real-time error display for invalid input and input clearing for easy correction.
    * Client-side and server-side validation to ensure data integrity.  
* **PDF Generation and Email Notification:**
    * Generates a PDF copy of the submitted application using ReportLab.
    * Sends the PDF to the user's email upon successful submission.
    * Sends password reset and confirmation emails.
* **Data Storage and Management:**
    * Utilizes Supabase, a cloud-based Postgres database, for secure data storage.
    * Employs secure API calls for database interactions.
* **User Interface (UI) Features:**
    * Modern and responsive design.
    * Light/dark theme toggle for user preference.
    * Clear and intuitive layout with helpful notifications.
    * Loading indicators during processing.


# **Android Application (APK):**

* **Direct Installation:** Installable directly on Android devices.
* **Functional Equivalence:** Provides the same functionality as the web application.
* **Native App-Like Experience:** Offers a smooth user experience without requiring a browser.


# **Technologies Used:**

* **Web Application (Frontend):** HTML, CSS, JavaScript (including form validation, voice input, session handling, theme switching, Speech Recognition API, and Fetch API).
* **Web Application (Backend):** Python (Flask framework), Flask-Mail, Flask-Session, bcrypt, Requests library, ReportLab.
* **Database:** Supabase (cloud-based Postgres database).
* **Android APK Packaging:**  Tools like PWA Builder, is used to package the web application into an installable APK.  

# Comclusion
This project aims to improve the accessibility and user-friendliness of the bank account application process by leveraging voice input, cross-platform availability, and a secure, robust architecture.

#
