CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_token TEXT,
    reset_token_expiry TIMESTAMP WITH TIME ZONE
);

 CREATE TABLE bank_forms (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        firstName VARCHAR(255),
        middleName VARCHAR(255),
        lastName VARCHAR(255),
        dob DATE,
        gender VARCHAR(20),
        maritalStatus VARCHAR(20),
        nationality VARCHAR(50),
        mothersMaidenName VARCHAR(255),
        residentialStreet VARCHAR(255),
        residentialCity VARCHAR(100),
        residentialState VARCHAR(50),
        residentialZip VARCHAR(20),
        mobilePhone VARCHAR(20),
        email VARCHAR(255),
        employmentStatus VARCHAR(50),
        occupation VARCHAR(100),
        monthlyIncome DECIMAL(10, 2),
        incomeSource VARCHAR(100),
        accountType VARCHAR(50),
        initialDeposit DECIMAL(10, 2),
        accountPurpose VARCHAR(100),
        modeOfOperation VARCHAR(50),
        nomineeName VARCHAR(255),
        nomineeRelationship VARCHAR(50),
        nomineeContact VARCHAR(20)
       );

