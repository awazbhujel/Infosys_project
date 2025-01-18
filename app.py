import email
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta
import bcrypt
import json
import logging

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=1)  # Reduced session lifetime
app.config['SESSION_COOKIE_SECURE'] = True  # Only send cookies over HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent client-side script access
Session(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),  # Log to a file
        logging.StreamHandler()  # Log to console
    ]
)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

def make_supabase_request(method, path, data=None, params=None):
    """
    Make a request to the Supabase API with robust error handling.
    """
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_KEY}",
    }
    url = f"{SUPABASE_URL}{path}"

    try:
        logging.info(f"Making Supabase API request: {method} {url}")
        logging.debug(f"Request data: {data}")
        logging.debug(f"Request params: {params}")

        response = requests.request(method, url, headers=headers, json=data, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors

        logging.info(f"Supabase API response: {response.status_code}")
        logging.debug(f"Response content: {response.content}")

        return response.json() if response.content else True

    except requests.exceptions.RequestException as e:
        logging.error(f"Supabase API request failed: {e}")
        return None

    except json.JSONDecodeError as e:
        logging.error(f"Failed to decode Supabase API response: {e}")
        return None

    except Exception as e:
        logging.error(f"Unexpected error during Supabase API request: {e}")
        return None

def transform_payload(data):
    """
    Transform camelCase keys to lowercase to match Supabase column names.
    """
    key_mapping = {
        "firstName": "firstname",
        "middleName": "middlename",  # Ensure middlename is included
        "lastName": "lastname",
        "maritalStatus": "maritalstatus",
        "mothersMaidenName": "mothersmaidenname",
        "residentialStreet": "residentialstreet",
        "residentialCity": "residentialcity",
        "residentialState": "residentialstate",
        "residentialZip": "residentialzip",
        "mobilePhone": "mobilephone",
        "employmentStatus": "employmentstatus",
        "monthlyIncome": "monthlyincome",
        "incomeSource": "incomesource",
        "accountType": "accounttype",
        "initialDeposit": "initialdeposit",
        "accountPurpose": "accountpurpose",
        "modeOfOperation": "modeofoperation",
        "nomineeName": "nomineename",
        "nomineeRelationship": "nomineerelationship",
        "nomineeContact": "nomineecontact",
    }

    transformed_data = {}
    for key, value in data.items():
        # Use the mapped key if it exists, otherwise use the original key
        transformed_key = key_mapping.get(key, key)
        transformed_data[transformed_key] = value

    # Ensure middlename is included in the payload
    if "middlename" not in transformed_data:
        transformed_data["middlename"] = ""  # Set a default value if missing

    return transformed_data

@app.route('/')
def index():
    return redirect(url_for('auth_form'))

@app.route('/auth/auth_form.html')
def auth_form():
    return render_template('auth_form.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    try:
        # Hash the password using bcrypt
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        logging.info(f"Hashed password: {hashed_password.decode('utf-8')}")  # Log the hashed password

        # Insert new user
        payload = {
            "username": username,
            "email": email,
            "password": hashed_password.decode('utf-8'),  # Store as string
        }

        response = make_supabase_request("POST", "/rest/v1/users", data=payload)

        if response:
            return jsonify({"message": "Signup successful"}), 200
        else:
            return jsonify({"message": "Signup failed", "error": "No response from Supabase"}), 500

    except Exception as e:
        logging.error(f"Error during signup: {e}")
        return jsonify({"message": "Signup failed", "error": str(e)}), 500

@app.route('/signin', methods=['POST'])
def signin():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    try:
        # Retrieve the user based on email
        query = {"email": f"eq.{email}"}
        logging.info(f"Supabase query: {query}")
        user_response = make_supabase_request("GET", f"/rest/v1/users", params=query)

        # Check if the user exists
        if not isinstance(user_response, list):
            logging.error("Unexpected response format from Supabase API")
            return jsonify({"message": "Signin failed"}), 500

        if len(user_response) == 0:
            logging.warning(f"User not found for email: {email}")
            return jsonify({"message": "Invalid email or password"}), 401

        user = user_response[0]
        logging.info(f"User found: {user}")

        # Validate that the email in the response matches the input email
        if user['email'] != email:
            logging.warning(f"Email mismatch: Expected {email}, found {user['email']}")
            return jsonify({"message": "Invalid email or password"}), 401

        # Verify the password using bcrypt
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            # Password is correct, set session
            session['email'] = email
            session['username'] = user['username']
            session.permanent = True

            logging.info(f"Signin successful for user: {user['username']}")
            return jsonify({"message": "Signin successful", "username": user['username']}), 200
        else:
            # Password is incorrect
            logging.warning(f"Password verification failed for user: {user['username']}")
            logging.warning(f"Stored password hash: {user['password']}")
            logging.warning(f"Provided password: {password}")
            return jsonify({"message": "Invalid email or password"}), 401

    except Exception as e:
        logging.error(f"Error during signin: {e}")
        return jsonify({"message": "Signin failed"}), 500
    
@app.route('/check-auth', methods=['GET'])
def check_auth():
    if 'email' in session:
        logging.info(f"User authenticated: {session.get('username', 'User')}")
        return jsonify({
            "isAuthenticated": True,
            "username": session.get('username', 'User')
        }), 200
    else:
        logging.warning("User not authenticated")
        return jsonify({
            "isAuthenticated": False
        }), 401

@app.route('/bankform/bank_form.html')
def bank_form():
    if 'email' not in session:
        logging.warning("User not authenticated, redirecting to auth form")
        return redirect(url_for('auth_form'))

    logging.info(f"Rendering bank form for user: {session.get('username', 'User')}")
    return render_template('bank_form.html')

@app.route('/sign-out', methods=['POST'])
def sign_out():
    logging.info("Sign out endpoint hit!")
    session.pop('email', None)
    session.pop('username', None)
    logging.info("Email and username removed from session")
    return jsonify(message='Logged out successfully', isAuthenticated=False)

@app.route('/submit-bank-form', methods=['POST'])
def submit_bank_form():
    if 'email' not in session:
        logging.warning("Unauthorized access to submit-bank-form")
        return jsonify({"message": "Unauthorized"}), 401

    # Parse JSON data from the request
    data = request.json
    logging.info("Received bank form data: %s", data)
    email = session['email']

    try:
        # Retrieve the user based on email
        query = {"email": f"eq.{email}"}
        user_response = make_supabase_request("GET", f"/rest/v1/users", params=query)

        if user_response and len(user_response) > 0:
            user = user_response[0]
            logging.info(f"User found: {user}")

            # Transform the payload keys to match Supabase column names
            transformed_payload = transform_payload(data)

            # Add the user_id to the payload
            transformed_payload["user_id"] = user['id']

            logging.info("Transformed payload for Supabase: %s", transformed_payload)

            # Insert the form data into Supabase
            response = make_supabase_request("POST", "/rest/v1/bank_forms", data=transformed_payload)

            if response:
                logging.info("Form data inserted successfully!")
                return jsonify({"message": "Form submission successful"}), 200
            else:
                logging.error("Failed to insert form data into Supabase")
                return jsonify({"message": "Form submission failed"}), 500
        else:
            logging.error("User not found in database")
            return jsonify({"message": "User not found"}), 404

    except Exception as e:
        logging.error(f"Error submitting form: {e}")
        return jsonify({"message": "Form submission failed", "error": str(e)}), 500

@app.before_request
def check_session_expiry():
    if 'email' in session:
        # Check if the session has expired
        if datetime.utcnow() > session.get('_fresh', datetime.utcnow()):
            session.clear()  # Clear the session if it has expired
            return jsonify({"message": "Session expired"}), 401

if __name__ == '__main__':
    app.run(debug=True)