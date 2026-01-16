// Mock data for offline testing
export const MOCK_CONTRACTS = [
  {
    "_id": "1",
    "contract_number": "FIN-2024-001",
    "customer_name": "Rajesh Kumar",
    "vehicle_number": "MH-12-AB-1234",
    "file_number": "FILE-001",
    "company_name": "HDFC Bank",
    "status": "Live",
    "contract_date": "2024-01-15",
    "customer": {
      "name": "Rajesh Kumar",
      "phone": "+91-9876543210",
      "address": "123 MG Road, Mumbai, Maharashtra",
      "photo": null
    },
    "guarantor": {
      "name": "Suresh Kumar",
      "phone": "+91-9876543211",
      "address": "124 MG Road, Mumbai, Maharashtra",
      "relation": "Brother",
      "photo": null
    },
    "vehicle": {
      "make": "Maruti Suzuki",
      "model": "Swift",
      "year": 2023,
      "registration_number": "MH-12-AB-1234",
      "vin": "MA3ERLF1S00123456",
      "color": "Red"
    },
    "loan": {
      "loan_amount": 500000,
      "emi_amount": 15000,
      "interest_rate": 10.5,
      "tenure_months": 36,
      "total_amount": 540000,
      "amount_paid": 45000,
      "outstanding_amount": 495000
    },
    "payment_schedule": [
      {
        "sno": 1,
        "emi_amount": 15000,
        "due_date": "2024-02-15",
        "payment_received": 15000,
        "date_received": "2024-02-14",
        "delay_days": 0
      },
      {
        "sno": 2,
        "emi_amount": 15000,
        "due_date": "2024-03-15",
        "payment_received": 15000,
        "date_received": "2024-03-16",
        "delay_days": 1
      },
      {
        "sno": 3,
        "emi_amount": 15000,
        "due_date": "2024-04-15",
        "payment_received": 10000,
        "date_received": "2024-04-20",
        "delay_days": 5
      },
      {
        "sno": 4,
        "emi_amount": 15000,
        "due_date": "2024-05-15",
        "payment_received": 0,
        "date_received": null,
        "delay_days": 0
      }
    ]
  },
  {
    "_id": "2",
    "contract_number": "FIN-2024-002",
    "customer_name": "Priya Sharma",
    "vehicle_number": "MH-14-CD-5678",
    "file_number": "FILE-002",
    "company_name": "ICICI Bank",
    "status": "Live",
    "contract_date": "2024-02-01",
    "customer": {
      "name": "Priya Sharma",
      "phone": "+91-9876543220",
      "address": "456 Park Street, Pune, Maharashtra",
      "photo": null
    },
    "guarantor": {
      "name": "Rajesh Sharma",
      "phone": "+91-9876543221",
      "address": "457 Park Street, Pune, Maharashtra",
      "relation": "Father",
      "photo": null
    },
    "vehicle": {
      "make": "Honda",
      "model": "City",
      "year": 2023,
      "registration_number": "MH-14-CD-5678",
      "vin": "MHCH780000123456",
      "color": "White"
    },
    "loan": {
      "loan_amount": 750000,
      "emi_amount": 22000,
      "interest_rate": 9.5,
      "tenure_months": 36,
      "total_amount": 792000,
      "amount_paid": 44000,
      "outstanding_amount": 748000
    },
    "payment_schedule": [
      {
        "sno": 1,
        "emi_amount": 22000,
        "due_date": "2024-03-01",
        "payment_received": 22000,
        "date_received": "2024-03-01",
        "delay_days": 0
      },
      {
        "sno": 2,
        "emi_amount": 22000,
        "due_date": "2024-04-01",
        "payment_received": 22000,
        "date_received": "2024-04-02",
        "delay_days": 1
      }
    ]
  },
  {
    "_id": "3",
    "contract_number": "FIN-2024-003",
    "customer_name": "Amit Patel",
    "vehicle_number": "GJ-01-EF-9012",
    "file_number": "FILE-003",
    "company_name": "SBI",
    "status": "Seized",
    "contract_date": "2023-12-10",
    "customer": {
      "name": "Amit Patel",
      "phone": "+91-9876543230",
      "address": "789 Gandhi Road, Ahmedabad, Gujarat",
      "photo": null
    },
    "guarantor": {
      "name": "Vijay Patel",
      "phone": "+91-9876543231",
      "address": "790 Gandhi Road, Ahmedabad, Gujarat",
      "relation": "Brother",
      "photo": null
    },
    "vehicle": {
      "make": "Hyundai",
      "model": "Creta",
      "year": 2022,
      "registration_number": "GJ-01-EF-9012",
      "vin": "MALHW480000123456",
      "color": "Black"
    },
    "loan": {
      "loan_amount": 600000,
      "emi_amount": 18000,
      "interest_rate": 11.0,
      "tenure_months": 36,
      "total_amount": 648000,
      "amount_paid": 18000,
      "outstanding_amount": 630000
    },
    "payment_schedule": [
      {
        "sno": 1,
        "emi_amount": 18000,
        "due_date": "2024-01-10",
        "payment_received": 18000,
        "date_received": "2024-01-10",
        "delay_days": 0
      },
      {
        "sno": 2,
        "emi_amount": 18000,
        "due_date": "2024-02-10",
        "payment_received": 0,
        "date_received": null,
        "delay_days": 35
      }
    ]
  },
  {
    "_id": "4",
    "contract_number": "FIN-2024-004",
    "customer_name": "Sneha Reddy",
    "vehicle_number": "TS-09-GH-3456",
    "file_number": "FILE-004",
    "company_name": "Axis Bank",
    "status": "Live",
    "contract_date": "2024-03-01",
    "customer": {
      "name": "Sneha Reddy",
      "phone": "+91-9876543240",
      "address": "321 Jubilee Hills, Hyderabad, Telangana",
      "photo": null
    },
    "guarantor": {
      "name": "Krishna Reddy",
      "phone": "+91-9876543241",
      "address": "322 Jubilee Hills, Hyderabad, Telangana",
      "relation": "Husband",
      "photo": null
    },
    "vehicle": {
      "make": "Toyota",
      "model": "Fortuner",
      "year": 2024,
      "registration_number": "TS-09-GH-3456",
      "vin": "MHFCW660000123456",
      "color": "Silver"
    },
    "loan": {
      "loan_amount": 850000,
      "emi_amount": 25000,
      "interest_rate": 9.0,
      "tenure_months": 36,
      "total_amount": 900000,
      "amount_paid": 25000,
      "outstanding_amount": 875000
    },
    "payment_schedule": [
      {
        "sno": 1,
        "emi_amount": 25000,
        "due_date": "2024-04-01",
        "payment_received": 25000,
        "date_received": "2024-04-01",
        "delay_days": 0
      }
    ]
  },
  {
    "_id": "5",
    "contract_number": "FIN-2024-005",
    "customer_name": "Vikram Singh",
    "vehicle_number": "DL-08-IJ-7890",
    "file_number": "FILE-005",
    "company_name": "HDFC Bank",
    "status": "Live",
    "contract_date": "2024-01-20",
    "customer": {
      "name": "Vikram Singh",
      "phone": "+91-9876543250",
      "address": "654 Connaught Place, New Delhi",
      "photo": null
    },
    "guarantor": {
      "name": "Ravi Singh",
      "phone": "+91-9876543251",
      "address": "655 Connaught Place, New Delhi",
      "relation": "Brother",
      "photo": null
    },
    "vehicle": {
      "make": "Maruti Suzuki",
      "model": "Brezza",
      "year": 2023,
      "registration_number": "DL-08-IJ-7890",
      "vin": "MA3CVKFS000123456",
      "color": "Blue"
    },
    "loan": {
      "loan_amount": 450000,
      "emi_amount": 14000,
      "interest_rate": 10.0,
      "tenure_months": 36,
      "total_amount": 504000,
      "amount_paid": 42000,
      "outstanding_amount": 462000
    },
    "payment_schedule": [
      {
        "sno": 1,
        "emi_amount": 14000,
        "due_date": "2024-02-20",
        "payment_received": 14000,
        "date_received": "2024-02-19",
        "delay_days": 0
      },
      {
        "sno": 2,
        "emi_amount": 14000,
        "due_date": "2024-03-20",
        "payment_received": 14000,
        "date_received": "2024-03-21",
        "delay_days": 1
      },
      {
        "sno": 3,
        "emi_amount": 14000,
        "due_date": "2024-04-20",
        "payment_received": 14000,
        "date_received": "2024-04-20",
        "delay_days": 0
      }
    ]
  }
];

export const MOCK_CREDENTIALS = {
  username: "admin",
  password: "admin123"
};
