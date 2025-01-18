#Project Structure
FORM/
├── .venv/                     
├── .vscode/
├── flask_session/         -get created through library 
├── static/                -add like these 
│ ├── auth_script.js
│ ├── bank_script.js
│ └── bank_style.css
├── templates/             -add like these 
│ ├── auth_form.html
│ └── bank_form.html
├── .env
├── .env.example
├── app.log 
├── app.py                 -add like these 
├── README.md
└── requirements.txt

# Voice-Enabled Bank Form Application

This is a web application for a bank form that uses voice input and provides user authentication.

## Local Setup Guide

Follow these instructions to run the application locally on your development machine.

### Prerequisites
-   **Python 3.6+:** Ensure Python is installed.
-   **pip:** Python package installer should also be installed.
-   **Git:** Version control system should be installed.
    * Install Git [here](https://git-scm.com/downloads)

### Step-by-step Installation
1.  **Clone the Repository:**

    ```bash
    git clone <YOUR_GITHUB_REPOSITORY_URL>
    cd <YOUR_PROJECT_DIRECTORY_NAME>
    ```

    *Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL of your repository.*
    *Replace `<YOUR_PROJECT_DIRECTORY_NAME>` with the name of your project's directory.*

2.  **Set Up a Virtual Environment (Recommended):**

    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On macOS/Linux
    venv\Scripts\activate # On Windows
    ```


3.  **Install Dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Create a `.env` File:**

    *   Create a `.env` file in your project's root directory.

    *   Add the following variables to the `.env` file:

        ```env
        SECRET_KEY=<YOUR_SECRET_KEY>
        SUPABASE_URL=<YOUR_SUPABASE_URL>
        SUPABASE_KEY=<YOUR_SUPABASE_KEY>
        ```

        *   Replace `<YOUR_SECRET_KEY>` with a long, random string.
        *   Replace `<YOUR_SUPABASE_URL>` with your Supabase project URL.
        *   Replace `<YOUR_SUPABASE_KEY>` with your Supabase API key.

5.  **Run the Application:**

    ```bash
    python app.py
    ```
    The application will start on http://127.0.0.1:5000/

6.  **Open in your browser:**
     *   Open a web browser and go to [http://127.0.0.1:5000/](http://127.0.0.1:5000/) to access the application.

7.  **Sign up with a valid email address (gmail.com, yahoo.com, outlook.com, hotmail.com, aol.com, or icloud.com)**
    *  Log in with the same credentials you created.
    *  Then fill in the form to submit to the database.
    
 ### Notes

-   Ensure the .env file is added to your .gitignore file to prevent pushing sensitive data.

### Dependencies
The dependencies for this project are listed in the `requirements.txt` file.

### Supabase Setup
This application uses Supabase as the backend for storing the user and bank form data. Please make sure you have properly setup your Supabase project and database tables according to the column names in `transform_payload` function.












