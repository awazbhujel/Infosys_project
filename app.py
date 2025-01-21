import io
import os
import logging
import bcrypt
import requests
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
from flask_mail import Mail, Message
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

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

# Flask-Mail Configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')  # e.g., 'smtp.gmail.com'
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))  # Default is 587 for TLS
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')  # Your email
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')  # Your email password or app password
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@example.com')

mail = Mail(app)

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
        "dob": "dob",
        "gender": "gender",
        "maritalStatus": "maritalstatus",
        "nationality": "nationality",
        "mothersMaidenName": "mothersmaidenname",
        "residentialStreet": "residentialstreet",
        "residentialCity": "residentialcity",
        "residentialState": "residentialstate",
        "residentialZip": "residentialzip",
        "mobilePhone": "mobilephone",
        "email": "email",
        "employmentStatus": "employmentstatus",
        "occupation": "occupation",
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

def generate_pdf(form_data):
    """
    Generate a PDF that looks like the online form, with boxes and filled-in data.
    """
    # Create a buffer to hold the PDF
    pdf_buffer = io.BytesIO()

    # Create a PDF document
    doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Content for the PDF
    content = []

    # Add a title
    title = Paragraph("<b>Bank Account Application Form</b>", styles['Title'])
    content.append(title)
    content.append(Spacer(1, 12))  # Add some space

    # Section 1: Personal Information
    personal_info = [
        ["Personal Information", ""],
        ["First Name:", form_data.get('firstname', '')],
        ["Middle Name:", form_data.get('middlename', '')],
        ["Last Name:", form_data.get('lastname', '')],
        ["Date of Birth:", form_data.get('dob', '')],
        ["Gender:", form_data.get('gender', '')],
        ["Marital Status:", form_data.get('maritalstatus', '')],
        ["Nationality:", form_data.get('nationality', '')],
        ["Mother's Maiden Name:", form_data.get('mothersmaidenname', '')],
        ["Residential Address:", f"{form_data.get('residentialstreet', '')}, {form_data.get('residentialcity', '')}, {form_data.get('residentialstate', '')} - {form_data.get('residentialzip', '')}"],
        ["Mobile Phone:", form_data.get('mobilephone', '')],
        ["Email Address:", form_data.get('email', '')],
    ]

    # Create a table for personal information
    personal_table = Table(personal_info, colWidths=[150, 350])
    personal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    content.append(KeepTogether(personal_table))
    content.append(Spacer(1, 24))  # Add space between sections

    # Section 2: Employment and Income Information
    employment_info = [
        ["Employment and Income Information", ""],
        ["Employment Status:", form_data.get('employmentstatus', '')],
        ["Occupation:", form_data.get('occupation', '')],
        ["Monthly Income:", f"₹{form_data.get('monthlyincome', '')}"],
        ["Source of Income:", form_data.get('incomesource', '')]
    ]

    # Create a table for employment information
    employment_table = Table(employment_info, colWidths=[150, 350])
    employment_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('WORDWRAP', (0, 0), (-1, -1), True),  # Enable text wrapping
        ('ROWHEIGHT', (0, 0), (-1, 0), 24),  # Increase row height for the header
    ]))

    content.append(KeepTogether(employment_table))
    content.append(Spacer(1, 24))  # Add space between sections

    # Section 3: Account Details
    account_info = [
        ["Account Details", ""],
        ["Account Type:", form_data.get('accounttype', '')],
        ["Initial Deposit Amount:", f"₹{form_data.get('initialdeposit', '')}"],
        ["Account Purpose:", form_data.get('accountpurpose', '')],
        ["Mode of Operation:", form_data.get('modeofoperation', '')],
    ]

    # Create a table for account details
    account_table = Table(account_info, colWidths=[150, 350])
    account_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    content.append(KeepTogether(account_table))
    content.append(Spacer(1, 24))  # Add space between sections

    # Section 4: Nominee Information
    nominee_info = [
        ["Nominee Information", ""],
        ["Nominee Name:", form_data.get('nomineename', '')],
        ["Nominee Relationship:", form_data.get('nomineerelationship', '')],
        ["Nominee Contact:", form_data.get('nomineecontact', '')],
    ]

    # Create a table for nominee information
    nominee_table = Table(nominee_info, colWidths=[150, 350])
    nominee_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    content.append(KeepTogether(nominee_table))

    # Build the PDF
    doc.build(content)

    # Return the PDF buffer
    pdf_buffer.seek(0)
    return pdf_buffer

def send_pdf_email(pdf_data, recipient_email):
    """
    Send an email with the generated PDF attached.
    """
    try:
        msg = Message(
            subject='Bank Form Submission',  # Email subject
            sender=app.config['MAIL_DEFAULT_SENDER'],  # Sender email
            recipients=[recipient_email]  # Recipient email(s)
        )

        # Attach the PDF file
        pdf_data.seek(0)  # Ensure the file pointer is at the beginning
        msg.attach(
            filename="bank_form.pdf",
            content_type="application/pdf",
            data=pdf_data.read()
        )

        # Send the email using Flask-Mail
        mail.send(msg)
        
        logging.info(f"PDF sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logging.error(f"Failed to send email: {e}")
        return False

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
        user_response = make_supabase_request("GET", f"/rest/v1/users", params=query)

        # Check if the user exists
        if not isinstance(user_response, list):
            logging.error("Unexpected response format from Supabase API")
            return jsonify({"message": "Signin failed"}), 500

        if len(user_response) == 0:
            logging.warning(f"User not found for email: {email}")
            return jsonify({"message": "Invalid email or password"}), 401

        user = user_response[0]

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
    logging.info("Received bank form data: %s", data)  # Log the received data
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

                # Generate the PDF from the form data
                pdf_data = generate_pdf(transformed_payload)

                # Send the PDF via email to the user (or another email)
                if send_pdf_email(pdf_data, user['email']):
                    return jsonify({"message": "Form submission successful and PDF sent to email"}), 200
                else:
                    return jsonify({"message": "Form submission successful, but failed to send email"}), 500
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